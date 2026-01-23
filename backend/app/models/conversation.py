"""Database models for conversation-based recommendation system."""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.db import Base


class ConversationSession(Base):
    """
    Represents a chat session that can optionally be linked to a profile.
    
    Business Logic:
    - Users can start a chat session without a profile (profile_id is nullable)
    - A profile can be appended to the session later for better recommendations
    - One session can have 0 or 1 profile
    - One session can have multiple messages and recommendations
    """
    
    __tablename__ = "conversation_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    profile_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("profiles.id", ondelete="SET NULL"), 
        nullable=True,  # NULLABLE: users can chat without a profile
        index=True,
        comment="Optional profile for context-aware recommendations"
    )
    title = Column(String(255), nullable=False, comment="Auto-generated or user-set session title")
    status = Column(String(50), default="active", nullable=False, index=True, comment="active or archived")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    last_message_at = Column(DateTime, nullable=True, index=True)
    
    # Relationships
    user = relationship("User", back_populates="conversation_sessions")
    profile = relationship("Profile", back_populates="conversation_sessions")
    messages = relationship(
        "ConversationMessage", 
        back_populates="session", 
        cascade="all, delete-orphan",
        order_by="ConversationMessage.created_at"
    )
    recommendations = relationship(
        "Recommendation", 
        back_populates="session",
        cascade="all, delete-orphan"
    )


class ConversationMessage(Base):
    """Individual messages within a conversation session."""
    
    __tablename__ = "conversation_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("conversation_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False, comment="user, assistant, or system")
    content = Column(Text, nullable=False, comment="Message content in markdown format")
    message_metadata = Column(JSONB, nullable=True, comment="Additional data: model, tokens, etc.")
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    session = relationship("ConversationSession", back_populates="messages")
