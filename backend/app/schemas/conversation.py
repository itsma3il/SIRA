"""Pydantic schemas for conversation endpoints."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ============= Request Schemas =============

class SessionCreate(BaseModel):
    """
    Create new conversation session.
    
    Note: profile_id is OPTIONAL. Users can start a chat without a profile
    and append one later for better recommendations.
    """
    profile_id: Optional[UUID] = Field(None, description="Optional profile ID for context-aware recommendations")
    title: Optional[str] = Field(None, max_length=255, description="Optional session title")


class SessionUpdate(BaseModel):
    """Update session fields, including appending a profile."""
    title: Optional[str] = Field(None, max_length=255, description="Session title")
    status: Optional[str] = Field(None, description="Session status: active or archived")
    profile_id: Optional[UUID] = Field(None, description="Profile to append to this session")


class MessageCreate(BaseModel):
    """Send a new message in the conversation."""
    content: str = Field(..., min_length=1, description="Message content")


# ============= Response Schemas =============

class MessageResponse(BaseModel):
    """Individual message response."""
    id: UUID
    role: str
    content: str
    metadata: Optional[dict] = Field(None, validation_alias="message_metadata")
    created_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True


class ProfileSummary(BaseModel):
    """Minimal profile info for session context."""
    id: UUID
    profile_name: str
    status: str
    
    class Config:
        from_attributes = True


class RecommendationSummary(BaseModel):
    """Recommendation info for session context with full details for display."""
    id: UUID
    query: str
    retrieved_context: Optional[list] = None
    ai_response: str
    structured_data: Optional[dict] = None
    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    """Basic session response."""
    id: UUID
    profile_id: Optional[UUID] = None  # Can be None if user hasn't appended a profile
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None
    message_count: int = 0
    
    class Config:
        from_attributes = True


class SessionListItem(BaseModel):
    """Session item for list view."""
    id: UUID
    profile_id: Optional[UUID] = None
    profile_name: Optional[str] = None  # Can be None if no profile attached
    title: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    message_count: int
    
    class Config:
        from_attributes = True


class SessionPeriodGroup(BaseModel):
    """Group of sessions by time period."""
    period: str = Field(..., description="Today, Yesterday, Last 7 days, Last month")
    sessions: List[SessionListItem]


class SessionListResponse(BaseModel):
    """List of sessions grouped by time periods."""
    sessions: List[SessionPeriodGroup]
    total: int


class SessionDetailResponse(BaseModel):
    """Full session with messages."""
    id: UUID
    profile_id: Optional[UUID] = None
    profile: Optional[ProfileSummary] = None  # Can be None if no profile attached
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]
    recommendations: List[RecommendationSummary] = []  # Multiple recommendations supported
    
    class Config:
        from_attributes = True


class MessagePairResponse(BaseModel):
    """Response containing both user and assistant messages."""
    user_message: MessageResponse
    assistant_message: MessageResponse


class RecommendationGenerationResponse(BaseModel):
    """Response when recommendation is generated within a session."""
    recommendation_id: UUID
    message_id: UUID
    ai_response: str
    structured_data: Optional[dict] = None
