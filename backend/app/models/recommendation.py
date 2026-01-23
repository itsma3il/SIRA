from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.db import Base


class Recommendation(Base):
    """
    Model for storing AI-generated academic recommendations.
    
    Business Logic:
    - Every recommendation MUST be linked to both a profile and a session
    - Recommendations appear as messages in chat AND have their own page
    - One profile can have multiple recommendations
    - One session can generate multiple recommendations
    - When a session is deleted, its recommendations are deleted (CASCADE)
    - When a profile is deleted, its recommendations are deleted (CASCADE)
    """
    
    __tablename__ = "recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("profiles.id", ondelete="CASCADE"), 
        nullable=False,
        index=True,
        comment="Profile used to generate this recommendation"
    )
    session_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"), 
        nullable=False,
        index=True,
        comment="Chat session where this recommendation was generated"
    )
    query = Column(Text, nullable=False, comment="Generated search query from profile")
    retrieved_context = Column(JSONB, nullable=True, comment="Retrieved programs from Pinecone")
    ai_response = Column(Text, nullable=False, comment="Full LLM response text")
    structured_data = Column(JSONB, nullable=True, comment="Parsed structured recommendation data")
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    feedback_rating = Column(Integer, nullable=True, comment="User rating: 1-5 or thumbs up/down")
    feedback_comment = Column(Text, nullable=True, comment="Optional user feedback text")
    
    # Relationships
    profile = relationship("Profile", back_populates="recommendations")
    session = relationship("ConversationSession", back_populates="recommendations")
