"""Main recommendation generation service with LLM integration."""

import logging
from typing import AsyncGenerator, Dict, List, Optional, Tuple
from uuid import UUID

from mistralai import Mistral

from app.core.config import get_settings
from app.db import session_scope
from app.models.profile import Profile
from app.models.recommendation import Recommendation
from app.repositories import profile_repository, recommendation_repository
from app.schemas.recommendation import RetrievedProgram
from app.services.prompt_service import (
    SYSTEM_PROMPT,
    create_user_prompt,
    parse_json_from_response,
)
from app.services.rag_service import retrieve_relevant_programs, retrieve_with_fallback
from app.services.query_service import profile_to_query

logger = logging.getLogger(__name__)
settings = get_settings()


class RecommendationService:
    """Service for generating AI-powered academic recommendations."""
    
    def __init__(self):
        """Initialize Mistral AI client."""
        if not settings.mistral_api_key:
            raise ValueError("MISTRAL_API_KEY not configured")
        
        self.client = Mistral(api_key=settings.mistral_api_key)
        self.model = settings.mistral_llm_model
    
    async def generate_recommendation(
        self,
        profile_id: UUID,
        session_id: UUID,
        top_k: int = 5,
        use_fallback: bool = True
    ) -> Recommendation:
        """
        Generate a complete recommendation for a student profile within a session.
        
        This is the main entry point that orchestrates the full RAG pipeline:
        1. Load profile from database
        2. Generate query from profile
        3. Retrieve relevant programs from Pinecone
        4. Construct prompt with profile + context
        5. Call LLM to generate recommendations
        6. Parse and structure response
        7. Save to database with session_id linkage
        
        Args:
            profile_id: UUID of the student profile
            session_id: UUID of the conversation session
            top_k: Number of programs to retrieve
            use_fallback: Whether to use fallback retrieval strategy
            
        Returns:
            Saved Recommendation object
            
        Raises:
            ValueError: If profile or session not found or invalid
            RuntimeError: If LLM call fails
        """
        logger.info(f"Generating recommendation for profile {profile_id} in session {session_id}")
        
        # Step 1: Load profile
        with session_scope() as db:
            profile = profile_repository.get_by_id(db, profile_id)
            if not profile:
                raise ValueError(f"Profile {profile_id} not found")
            
            # Ensure profile is fully loaded with relationships
            db.refresh(profile)
        
        # Step 2: Generate query
        query_text = profile_to_query(profile)
        logger.info(f"Generated query: {query_text}")
        
        # Step 3: Retrieve programs
        if use_fallback:
            programs, strategy = await retrieve_with_fallback(profile, top_k=top_k)
            logger.info(f"Retrieved {len(programs)} programs using strategy: {strategy}")
        else:
            programs = await retrieve_relevant_programs(profile, top_k=top_k)
            logger.info(f"Retrieved {len(programs)} programs")
        
        if not programs:
            raise ValueError("No relevant programs found for this profile")
        
        # Step 4: Create prompt
        user_prompt = create_user_prompt(profile, programs)
        
        # Step 5: Call LLM
        logger.info("Calling Mistral AI LLM...")
        ai_response = await self._call_llm(user_prompt)
        
        # Step 6: Parse structured data
        structured_data = parse_json_from_response(ai_response)
        
        # Convert programs to JSON-serializable format
        retrieved_context = [
            {
                "university": p.university,
                "program_name": p.program_name,
                "score": p.score,
                "metadata": p.metadata,
                "content": p.content[:500]  # Truncate for storage
            }
            for p in programs
        ]
        
        # Step 7: Save to database with session_id
        with session_scope() as db:
            recommendation = Recommendation(
                profile_id=profile_id,
                session_id=session_id,  # REQUIRED: Link to conversation session
                query=query_text,
                retrieved_context=retrieved_context,
                ai_response=ai_response,
                structured_data=structured_data
            )
            db.add(recommendation)
            db.commit()
            db.refresh(recommendation)
            
            logger.info(f"Saved recommendation {recommendation.id} for session {session_id}")
            return recommendation
    
    async def _call_llm(self, user_prompt: str) -> str:
        """
        Call Mistral AI LLM with retry logic.
        
        Args:
            user_prompt: User prompt with profile + context
            
        Returns:
            LLM response text
        """
        try:
            response = self.client.chat.complete(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"LLM call failed: {str(e)}")
            raise RuntimeError(f"Failed to generate recommendation: {str(e)}")
    
    async def stream_recommendation(
        self,
        profile_id: UUID,
        session_id: UUID,
        top_k: int = 5,
        use_fallback: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Generate recommendation with streaming response within a session.
        
        This method yields chunks of the LLM response as they're generated,
        allowing for real-time UI updates.
        
        Args:
            profile_id: UUID of the student profile
            session_id: UUID of the conversation session
            top_k: Number of programs to retrieve
            use_fallback: Whether to use fallback retrieval strategy
            
        Yields:
            Chunks of the LLM response text
        """
        logger.info(f"Streaming recommendation for profile {profile_id} in session {session_id}")
        
        # Steps 1-4: Same as generate_recommendation
        with session_scope() as db:
            profile = profile_repository.get_by_id(db, profile_id)
            if not profile:
                raise ValueError(f"Profile {profile_id} not found")
            db.refresh(profile)
        
        query_text = profile_to_query(profile)
        
        if use_fallback:
            programs, strategy = await retrieve_with_fallback(profile, top_k=top_k)
        else:
            programs = await retrieve_relevant_programs(profile, top_k=top_k)
        
        if not programs:
            raise ValueError("No relevant programs found")
        
        user_prompt = create_user_prompt(profile, programs)
        
        # Step 5: Stream LLM response
        full_response = []
        
        try:
            stream = self.client.chat.stream(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            for chunk in stream:
                if chunk.data.choices[0].delta.content:
                    content = chunk.data.choices[0].delta.content
                    full_response.append(content)
                    yield content
        
        except Exception as e:
            logger.error(f"Streaming failed: {str(e)}")
            raise RuntimeError(f"Failed to stream recommendation: {str(e)}")
        
        # Step 6-7: Save after streaming completes with session_id
        ai_response = "".join(full_response)
        structured_data = parse_json_from_response(ai_response)
        
        retrieved_context = [
            {
                "university": p.university,
                "program_name": p.program_name,
                "score": p.score,
                "metadata": p.metadata,
                "content": p.content[:500]
            }
            for p in programs
        ]
        
        with session_scope() as db:
            recommendation = Recommendation(
                profile_id=profile_id,
                session_id=session_id,  # REQUIRED: Link to conversation session
                query=query_text,
                retrieved_context=retrieved_context,
                ai_response=ai_response,
                structured_data=structured_data
            )
            db.add(recommendation)
            db.commit()
            logger.info(f"Saved streamed recommendation {recommendation.id} for session {session_id}")
    
    def get_recommendations_by_profile(
        self,
        profile_id: UUID,
        limit: int = 10
    ) -> List[Recommendation]:
        """
        Get all recommendations for a profile.
        
        Args:
            profile_id: Profile UUID
            limit: Maximum number to return
            
        Returns:
            List of recommendations, newest first
        """
        with session_scope() as db:
            return (
                db.query(Recommendation)
                .filter(Recommendation.profile_id == profile_id)
                .order_by(Recommendation.created_at.desc())
                .limit(limit)
                .all()
            )
    
    def get_recommendation_by_id(self, recommendation_id: UUID) -> Optional[Recommendation]:
        """Get a specific recommendation by ID."""
        with session_scope() as db:
            return db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    
    def submit_feedback(
        self,
        recommendation_id: UUID,
        rating: int,
        comment: Optional[str] = None
    ) -> Recommendation:
        """
        Submit user feedback for a recommendation.
        
        Args:
            recommendation_id: Recommendation UUID
            rating: Rating 1-5
            comment: Optional feedback text
            
        Returns:
            Updated Recommendation object
        """
        with session_scope() as db:
            recommendation = db.query(Recommendation).filter(
                Recommendation.id == recommendation_id
            ).first()
            
            if not recommendation:
                raise ValueError(f"Recommendation {recommendation_id} not found")
            
            recommendation.feedback_rating = rating
            recommendation.feedback_comment = comment
            db.commit()
            db.refresh(recommendation)
            
            logger.info(f"Updated feedback for recommendation {recommendation_id}")
            return recommendation


# Singleton instance
_recommendation_service: Optional[RecommendationService] = None


def get_recommendation_service() -> RecommendationService:
    """Get singleton recommendation service instance."""
    global _recommendation_service
    if _recommendation_service is None:
        _recommendation_service = RecommendationService()
    return _recommendation_service
