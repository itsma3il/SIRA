"""Pydantic schemas for admin endpoints."""
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class ProgramCount(BaseModel):
    """Program recommendation count."""
    program: str
    count: int


class DashboardMetrics(BaseModel):
    """Dashboard metrics for admin overview."""
    total_users: int
    new_users_period: int
    active_users: int
    total_profiles: int
    total_recommendations: int
    total_sessions: int
    recommendations_with_feedback: int
    avg_feedback_rating: float
    top_recommended_programs: List[ProgramCount]
    low_rated_recommendations_count: int
    period_days: int


class ProfileListItem(BaseModel):
    """Profile list item for admin view."""
    id: UUID
    user_id: UUID
    profile_name: str
    status: str
    created_at: datetime
    updated_at: datetime
    current_education_level: Optional[str] = None
    current_field: Optional[str] = None
    target_field: Optional[str] = None
    user_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class SessionListItem(BaseModel):
    """Session list item for admin view."""
    id: UUID
    user_id: UUID
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    user_email: Optional[str] = None
    profile_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class RecommendationListItem(BaseModel):
    """Recommendation list item for admin view."""
    id: UUID
    profile_id: UUID
    session_id: UUID
    created_at: datetime
    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None
    user_email: Optional[str] = None
    profile_name: Optional[str] = None
    program_count: int = 0
    
    class Config:
        from_attributes = True


class ProgramInfo(BaseModel):
    """Program information from recommendation."""
    name: str
    match_score: Optional[int] = None


class RecommendationAnalytics(BaseModel):
    """Detailed analytics for a recommendation."""
    id: UUID
    profile_id: UUID
    session_id: UUID
    query: str
    retrieved_context: Optional[Any] = None
    ai_response: str
    structured_data: Optional[Any] = None
    created_at: datetime
    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None
    profile_name: Optional[str] = None
    user_email: Optional[str] = None
    programs: List[ProgramInfo] = []
    
    class Config:
        from_attributes = True
