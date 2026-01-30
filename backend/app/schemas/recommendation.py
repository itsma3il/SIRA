"""Pydantic schemas for recommendation operations."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RetrievedProgram(BaseModel):
    """Schema for a single retrieved program from vector search."""
    
    university: str
    program_name: str
    score: float = Field(..., description="Relevance score from vector search")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Program metadata")
    content: str = Field(..., description="Program description/content")


class RecommendationCreate(BaseModel):
    """
    Schema for creating a new recommendation.
    
    Note: Both profile_id and session_id are required.
    Recommendations MUST be linked to both a profile and a chat session.
    """
    
    profile_id: UUID
    session_id: UUID


class RecommendationFeedback(BaseModel):
    """Schema for submitting feedback on a recommendation."""
    
    feedback_rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    feedback_comment: Optional[str] = Field(None, max_length=1000, description="Optional feedback text")


class RecommendationResponse(BaseModel):
    """Schema for recommendation response."""
    
    id: UUID
    profile_id: UUID
    session_id: UUID  # Always present - recommendations are always linked to a session
    query: str
    retrieved_context: Optional[List[Dict[str, Any]]] = None
    ai_response: str
    structured_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None
    
    class ConfigDict:
        from_attributes = True


class RecommendationList(BaseModel):
    """Schema for list of recommendations."""
    
    recommendations: List[RecommendationResponse]
    total: int


class StreamChunk(BaseModel):
    """Schema for streaming response chunks."""
    
    chunk: str
    done: bool = False
