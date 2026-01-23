"""Conversational AI service for chat-based recommendations."""
import json
import logging
from typing import List, Optional, AsyncGenerator
from uuid import UUID

from mistralai import Mistral

from app.core.config import get_settings
from app.models.profile import Profile
from app.models.recommendation import Recommendation
from app.models.conversation import ConversationMessage

logger = logging.getLogger(__name__)


class ConversationalAIService:
    """Service for context-aware AI conversations about recommendations."""
    
    def __init__(self):
        settings = get_settings()
        self.client = Mistral(api_key=settings.mistral_api_key)
        self.model = settings.mistral_llm_model
    
    def build_system_prompt(
        self,
        profile: Profile,
        recommendation: Optional[Recommendation] = None
    ) -> str:
        """
        Build context-aware system prompt with profile and recommendation info.
        
        Args:
            profile: Student profile with academic info
            recommendation: Previous recommendation if exists
        
        Returns:
            System prompt string
        """
        # Base prompt
        prompt = """You are an expert academic advisor AI assistant helping students find and understand graduate programs.

Your role:
- Answer questions about academic programs and recommendations
- Provide detailed information about admission requirements, costs, and difficulty
- Help students make informed decisions
- Use markdown formatting for clarity

Guidelines:
- Be encouraging and supportive
- Provide specific, actionable advice
- Reference the student's profile when relevant
- If asked about programs not in the recommendations, acknowledge this and focus on what you know
"""
        
        # Add profile context
        prompt += f"\n\n**Student Profile:**\n"
        prompt += f"- Name: {profile.profile_name}\n"
        
        if hasattr(profile, 'academic_record') and profile.academic_record:
            record = profile.academic_record
            if record.current_status:
                prompt += f"- Current Status: {record.current_status}\n"
            if record.current_field:
                prompt += f"- Field of Study: {record.current_field}\n"
            if record.gpa:
                prompt += f"- GPA: {record.gpa}/4.0\n"
            if record.current_institution:
                prompt += f"- Current Institution: {record.current_institution}\n"
        
        if hasattr(profile, 'student_preferences') and profile.student_preferences:
            prefs = profile.student_preferences
            if prefs.budget_range_max:
                prompt += f"- Budget: Up to ${prefs.budget_range_max:,.0f}/year\n"
            if prefs.geographic_preference:
                prompt += f"- Preferred Location: {prefs.geographic_preference}\n"
            if prefs.career_goals:
                prompt += f"- Career Goals: {prefs.career_goals}\n"
            if prefs.favorite_subjects:
                subjects = prefs.favorite_subjects[:3]
                prompt += f"- Favorite Subjects: {', '.join(subjects)}\n"
        
        # Add recommendation context if exists
        if recommendation and recommendation.structured_data:
            structured = recommendation.structured_data
            prompt += "\n\n**Generated Recommendations:**\n"
            
            if "program_names" in structured:
                programs = structured["program_names"]
                prompt += f"You recommended {len(programs)} programs:\n"
                for i, prog in enumerate(programs[:5], 1):
                    prompt += f"{i}. {prog}"
                    if "match_scores" in structured and i-1 < len(structured["match_scores"]):
                        prompt += f" (Match: {structured['match_scores'][i-1]}%)"
                    prompt += "\n"
        
        prompt += "\n\nRespond in a friendly, professional tone using markdown formatting."
        return prompt
    
    async def generate_response(
        self,
        user_message: str,
        profile: Profile,
        recommendation: Optional[Recommendation] = None,
        message_history: Optional[List[ConversationMessage]] = None
    ) -> str:
        """
        Generate AI response with full context.
        
        Args:
            user_message: Current user's message
            profile: Student profile
            recommendation: Previous recommendation if exists
            message_history: Recent conversation history (last 10 messages)
        
        Returns:
            AI response as markdown string
        """
        try:
            # Build messages array
            messages = []
            
            # System prompt with context
            system_prompt = self.build_system_prompt(profile, recommendation)
            messages.append({"role": "system", "content": system_prompt})
            
            # Add conversation history (last 10 messages)
            if message_history:
                for msg in message_history[-10:]:
                    messages.append({"role": msg.role, "content": msg.content})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Get response from Mistral
            response = self.client.chat.complete(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"Generated AI response: {len(ai_response)} chars")
            
            return ai_response
        
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            raise RuntimeError(f"Failed to generate response: {str(e)}")
    
    async def stream_response(
        self,
        user_message: str,
        profile: Profile,
        recommendation: Optional[Recommendation] = None,
        message_history: Optional[List[ConversationMessage]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response with full context.
        
        Args:
            user_message: Current user's message
            profile: Student profile
            recommendation: Previous recommendation if exists
            message_history: Recent conversation history
        
        Yields:
            Chunks of AI response
        """
        try:
            # Build messages array (same as generate_response)
            messages = []
            
            system_prompt = self.build_system_prompt(profile, recommendation)
            messages.append({"role": "system", "content": system_prompt})
            
            if message_history:
                for msg in message_history[-10:]:
                    messages.append({"role": msg.role, "content": msg.content})
            
            messages.append({"role": "user", "content": user_message})
            
            # Stream from Mistral
            stream = self.client.chat.stream(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            
            for chunk in stream:
                if chunk.data.choices and chunk.data.choices[0].delta.content:
                    yield chunk.data.choices[0].delta.content
        
        except Exception as e:
            logger.error(f"Error streaming AI response: {str(e)}")
            yield f"[ERROR] {str(e)}"


def get_conversational_ai_service() -> ConversationalAIService:
    """Get singleton instance of ConversationalAIService."""
    return ConversationalAIService()
