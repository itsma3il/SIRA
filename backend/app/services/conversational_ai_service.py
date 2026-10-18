"""Conversational AI service for chat-based recommendations."""
import logging
from collections.abc import AsyncGenerator

from app.core.ai_providers import BaseLLMProvider, get_llm_provider
from app.models.conversation import ConversationMessage
from app.models.profile import Profile
from app.models.recommendation import Recommendation

logger = logging.getLogger(__name__)


class ConversationalAIService:
    """Service for context-aware AI conversations about recommendations."""

    def __init__(self, llm_provider: BaseLLMProvider | None = None):
        self.llm_provider = llm_provider or get_llm_provider()

    def build_system_prompt(
        self,
        profile: Profile | None = None,
        recommendation: Recommendation | None = None
    ) -> str:
        """
        Build context-aware system prompt with profile and recommendation info.

        Args:
            profile: Student profile with academic info (optional)
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

        # Add profile context if available
        if profile:
            prompt += "\n\n**Student Profile:**\n"
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
        else:
            # No profile attached - provide general guidance
            prompt += "\n\n**Note:** This conversation has no attached profile. Provide general academic guidance.\n"

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
        profile: Profile | None = None,
        recommendation: Recommendation | None = None,
        message_history: list[ConversationMessage] | None = None
    ) -> str:
        """
        Generate AI response with full context.

        Args:
            user_message: Current user's message
            profile: Student profile (optional)
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

            # Get response from configured LLM provider
            ai_response = await self.llm_provider.complete(
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            logger.info(f"Generated AI response: {len(ai_response)} chars")
            return ai_response

        except Exception as e:
            logger.error(f"Error generating AI response: {e!s}")
            raise RuntimeError(f"Failed to generate response: {e!s}")

    async def stream_response(
        self,
        user_message: str,
        profile: Profile | None = None,
        recommendation: Recommendation | None = None,
        message_history: list[ConversationMessage] | None = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response with full context.

        Args:
            user_message: Current user's message
            profile: Student profile (optional)
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
                # Limit to last 6 messages for faster processing
                for msg in message_history[-6:]:
                    messages.append({"role": msg.role, "content": msg.content})

            messages.append({"role": "user", "content": user_message})

            logger.info(f"Starting stream with {len(messages)} messages in context")

            # Stream from configured LLM provider
            chunk_count = 0
            async for chunk in self.llm_provider.stream(
                messages=messages,
                temperature=0.7,
                max_tokens=1500  # Reduced for faster responses
            ):
                chunk_count += 1
                if chunk_count == 1:
                    logger.info("First token received from LLM")
                yield chunk

            logger.info(f"Stream complete, {chunk_count} chunks generated")

        except Exception as e:
            logger.error(f"Error streaming AI response: {e!s}")
            yield f"[ERROR] {e!s}"



def get_conversational_ai_service() -> ConversationalAIService:
    """Get singleton instance of ConversationalAIService."""
    return ConversationalAIService()
