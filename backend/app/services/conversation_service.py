"""Conversation service for managing chat sessions and messages."""
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories import conversation_repository
from app.schemas.conversation import (
    SessionCreate, SessionUpdate, MessageCreate,
    SessionResponse, SessionListResponse, SessionDetailResponse,
    MessagePairResponse, RecommendationGenerationResponse
)
from app.models.profile import Profile
from app.models.recommendation import Recommendation
from app.services.conversational_ai_service import get_conversational_ai_service
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)


class ConversationService:
    """Business logic for conversation management."""
    
    def __init__(self):
        self.ai_service = get_conversational_ai_service()
        self.recommendation_service = RecommendationService()
    
    def create_session(
        self,
        db: Session,
        user_id: UUID,
        session_create: SessionCreate
    ) -> SessionResponse:
        """
        Create new conversation session with auto-generated title.
        
        Note: profile_id is optional. Users can start a chat without a profile
        and append one later for recommendations.
        
        Args:
            db: Database session
            user_id: User's ID
            session_create: Session creation data (optional profile_id)
        
        Returns:
            Created session response
        """
        profile_name = "General"
        
        # If profile_id is provided, verify it exists and belongs to user
        if session_create.profile_id:
            profile = db.query(Profile).filter(Profile.id == session_create.profile_id).first()
            if not profile:
                raise ValueError(f"Profile {session_create.profile_id} not found")
            
            # Verify profile belongs to user
            if profile.user_id != user_id:
                raise ValueError("Profile does not belong to user")
            
            profile_name = profile.profile_name
        
        # Use provided title or auto-generate from profile/timestamp
        if session_create.title:
            title = session_create.title
        else:
            title = f"{profile_name} - {datetime.utcnow().strftime('%b %d, %Y %H:%M')}"
        
        # Create session
        session = conversation_repository.create_session(
            db=db,
            user_id=user_id,
            profile_id=session_create.profile_id,  # Can be None
            title=title
        )
        
        logger.info(f"Created session {session.id} for user {user_id} (profile: {session_create.profile_id})")
        
        return SessionResponse.model_validate(session)
    
    def get_user_sessions(
        self,
        db: Session,
        user_id: UUID,
        profile_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> SessionListResponse:
        """
        Get user's sessions with time-period grouping.
        
        Args:
            db: Database session
            user_id: User's ID
            profile_id: Optional profile filter
            status: Optional status filter (active/archived)
            limit: Max sessions to return
        
        Returns:
            Sessions grouped by time periods
        """
        # Get sessions from repository
        sessions = conversation_repository.get_by_user(
            db=db,
            user_id=user_id,
            profile_id=profile_id,
            status=status,
            limit=limit
        )
        
        # Transform sessions to include computed fields
        session_items = []
        for session in sessions:
            # Get message count
            message_count = conversation_repository.get_message_count(db, session.id)
            
            # Get last message preview
            recent_messages = conversation_repository.get_recent_messages(db, session.id, limit=1)
            last_message = recent_messages[0].content[:100] if recent_messages else None
            
            # Get profile name if profile exists
            profile_name = session.profile.profile_name if session.profile else None
            
            session_items.append({
                "id": session.id,
                "profile_id": session.profile_id,
                "profile_name": profile_name,
                "title": session.title,
                "last_message": last_message,
                "last_message_at": session.last_message_at,
                "message_count": message_count
            })
        
        # Group by time periods
        grouped = conversation_repository.group_sessions_by_period_with_items(session_items)
        
        total = len(sessions)
        logger.info(f"Retrieved {total} sessions for user {user_id}")
        
        return SessionListResponse(
            sessions=grouped,
            total=total
        )
    
    def get_session_detail(
        self,
        db: Session,
        user_id: UUID,
        session_id: UUID
    ) -> SessionDetailResponse:
        """
        Get full session with messages and related data.
        
        Args:
            db: Database session
            user_id: User's ID
            session_id: Session ID
        
        Returns:
            Full session details
        """
        session = conversation_repository.get_by_id_with_messages(db, session_id)
        
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        if session.user_id != user_id:
            raise ValueError("Session does not belong to user")
        
        return SessionDetailResponse.model_validate(session)
    
    def update_session(
        self,
        db: Session,
        user_id: UUID,
        session_id: UUID,
        updates: SessionUpdate
    ) -> SessionResponse:
        """
        Update session title, status, or append a profile.
        
        Args:
            db: Database session
            user_id: User's ID
            session_id: Session ID
            updates: Fields to update (including optional profile_id)
        
        Returns:
            Updated session
        """
        session = conversation_repository.get_by_id(db, session_id)
        
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        if session.user_id != user_id:
            raise ValueError("Session does not belong to user")
        
        # Build updates dict
        update_data = {}
        if updates.title is not None:
            update_data["title"] = updates.title
        if updates.status is not None:
            update_data["status"] = updates.status
        
        # Handle profile appending
        if updates.profile_id is not None:
            # Verify profile exists and belongs to user
            profile = db.query(Profile).filter(Profile.id == updates.profile_id).first()
            if not profile:
                raise ValueError(f"Profile {updates.profile_id} not found")
            if profile.user_id != user_id:
                raise ValueError("Profile does not belong to user")
            
            update_data["profile_id"] = updates.profile_id
            logger.info(f"Appending profile {updates.profile_id} to session {session_id}")
        
        updated_session = conversation_repository.update(db, session_id, update_data)
        
        logger.info(f"Updated session {session_id}: {update_data}")
        
        return SessionResponse.model_validate(updated_session)
    
    def delete_session(
        self,
        db: Session,
        user_id: UUID,
        session_id: UUID
    ) -> None:
        """
        Delete session (cascades to messages and recommendation).
        
        Args:
            db: Database session
            user_id: User's ID
            session_id: Session ID
        """
        session = conversation_repository.get_by_id(db, session_id)
        
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        if session.user_id != user_id:
            raise ValueError("Session does not belong to user")
        
        conversation_repository.delete(db, session_id)
        logger.info(f"Deleted session {session_id}")
    
    async def send_message(
        self,
        db: Session,
        user_id: UUID,
        session_id: UUID,
        message_create: MessageCreate
    ) -> MessagePairResponse:
        """
        Send user message and get AI response.
        
        Args:
            db: Database session
            user_id: User's ID
            session_id: Session ID
            message_create: User's message
        
        Returns:
            User message + AI response
        """
        # Verify session ownership
        session = conversation_repository.get_by_id(db, session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        if session.user_id != user_id:
            raise ValueError("Session does not belong to user")
        
        # Add user message
        user_message = conversation_repository.add_message(
            db=db,
            session_id=session_id,
            role="user",
            content=message_create.content
        )
        
        # Get context for AI
        profile = session.profile
        recommendation = session.recommendation
        message_history = conversation_repository.get_recent_messages(db, session_id, limit=10)
        
        # Generate AI response
        ai_response = await self.ai_service.generate_response(
            user_message=message_create.content,
            profile=profile,
            recommendation=recommendation,
            message_history=message_history
        )
        
        # Add AI message
        assistant_message = conversation_repository.add_message(
            db=db,
            session_id=session_id,
            role="assistant",
            content=ai_response
        )
        
        logger.info(f"Completed message exchange in session {session_id}")
        
        return MessagePairResponse(
            user_message=user_message,
            assistant_message=assistant_message
        )
    
    async def generate_initial_recommendation(
        self,
        db: Session,
        user_id: UUID,
        session_id: UUID
    ) -> RecommendationGenerationResponse:
        """
        Generate initial AI recommendation for the session.
        
        Note: Session MUST have a profile attached before generating recommendations.
        
        Args:
            db: Database session
            user_id: User's ID
            session_id: Session ID
        
        Returns:
            Recommendation with welcome message
            
        Raises:
            ValueError: If session has no profile or recommendation already exists
        """
        # Verify session
        session = conversation_repository.get_by_id(db, session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        if session.user_id != user_id:
            raise ValueError("Session does not belong to user")
        
        # Verify session has a profile
        if not session.profile_id:
            raise ValueError("Cannot generate recommendations: session has no profile attached. Please append a profile first.")
        
        # Check if recommendation already exists for this session
        # Note: A session can have multiple recommendations, but this checks for initial generation
        # You might want to handle this differently based on requirements
        
        # Generate recommendation using recommendation service with session_id
        recommendation = await self.recommendation_service.generate_recommendation(
            profile_id=session.profile_id,
            session_id=session_id  # Pass session_id
        )
        
        # Recommendation is already linked to session via session_id in the service
        
        # Create welcome message with recommendation summary
        structured = recommendation.structured_data or {}
        programs = structured.get("program_names", [])[:5]
        
        welcome_content = f"""# Academic Recommendations Generated

I've analyzed your profile and found **{len(programs)}** graduate programs that match your goals.

**Top Recommendations:**
"""
        for i, prog in enumerate(programs, 1):
            match_score = structured.get("match_scores", [])[i-1] if i-1 < len(structured.get("match_scores", [])) else "N/A"
            welcome_content += f"\n{i}. **{prog}** (Match: {match_score}%)"
        
        welcome_content += "\n\nFeel free to ask me any questions about these programs, admission requirements, costs, or anything else!"
        
        # Add welcome message
        assistant_message = conversation_repository.add_message(
            db=db,
            session_id=session_id,
            role="assistant",
            content=welcome_content,
            metadata={"type": "recommendation_generated"}
        )
        
        logger.info(f"Generated initial recommendation for session {session_id}")
        
        return RecommendationGenerationResponse(
            recommendation_id=recommendation.id,
            message_id=assistant_message.id,
            ai_response=welcome_content,
            structured_data=recommendation.structured_data
        )


def get_conversation_service() -> ConversationService:
    """Get singleton instance of ConversationService."""
    return ConversationService()
