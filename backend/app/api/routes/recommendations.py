"""API endpoints for recommendation generation and management."""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.core.security import get_current_user, get_current_user_flexible
from app.db import session_scope
from app.models.user import User
from app.repositories import profile_repository
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationFeedback,
    RecommendationList,
    RecommendationResponse,
)
from app.services.recommendation_service import get_recommendation_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/generate", response_model=RecommendationResponse, status_code=status.HTTP_201_CREATED)
async def generate_recommendation(
    data: RecommendationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Generate a new AI recommendation for a student profile within a conversation session.
    
    This endpoint:
    1. Validates that the profile exists and belongs to the current user
    2. Validates that the session exists and belongs to the current user
    3. Retrieves relevant programs using RAG
    4. Calls LLM to generate personalized recommendations
    5. Saves the recommendation to the database linked to both profile and session
    
    Returns the complete recommendation with structured data.
    
    Note: Both profile_id and session_id are required.
    """
    # Verify profile belongs to user
    profile = profile_repository.get_by_id(session, data.profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {data.profile_id} not found"
        )
    
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to generate recommendations for this profile"
        )
    
    # Verify session belongs to user
    from app.repositories import conversation_repository
    conv_session = conversation_repository.get_by_id(session, data.session_id)
    if not conv_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {data.session_id} not found"
        )
    
    if conv_session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to use this session"
        )
    
    # Generate recommendation
    try:
        service = get_recommendation_service()
        recommendation = await service.generate_recommendation(
            profile_id=data.profile_id,
            session_id=data.session_id,
            top_k=5,
            use_fallback=True
        )
        
        return RecommendationResponse.model_validate(recommendation)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        logger.error(f"Recommendation generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendation. Please try again."
        )


@router.get("/stream/{profile_id}/{session_id}")
async def stream_recommendation(
    profile_id: UUID,
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Generate recommendation with streaming response (Server-Sent Events).
    
    This endpoint returns chunks of the LLM response as they're generated,
    allowing for real-time UI updates.
    
    The response is saved to the database after streaming completes,
    linked to both the profile and session.
    
    Note: Uses standard Authorization header authentication (secure).
    """
    # Verify profile belongs to user
    profile = profile_repository.get_by_id(session, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found"
        )
    
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this profile"
        )
    
    # Verify session belongs to user
    from app.repositories import conversation_repository
    conv_session = conversation_repository.get_by_id(session, session_id)
    if not conv_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    
    if conv_session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to use this session"
        )
    
    # Stream recommendation
    async def event_generator():
        try:
            service = get_recommendation_service()
            async for chunk in service.stream_recommendation(
                profile_id=profile_id,
                session_id=session_id
            ):
                # SSE format: data: {content}\n\n
                yield f"data: {chunk}\n\n"
            
            # Send done signal
            yield "data: [DONE]\n\n"
        
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            yield f"data: [ERROR] {str(e)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable buffering in nginx
        }
    )


@router.get("/profile/{profile_id}", response_model=RecommendationList)
async def get_profile_recommendations(
    profile_id: UUID,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all recommendations for a specific profile.
    
    Returns recommendations in reverse chronological order (newest first).
    """
    # Verify profile belongs to user
    profile = profile_repository.get_by_id(session, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found"
        )
    
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this profile"
        )
    
    # Get recommendations
    service = get_recommendation_service()
    recommendations = service.get_recommendations_by_profile(profile_id, limit=limit)
    
    return RecommendationList(
        recommendations=[RecommendationResponse.model_validate(r) for r in recommendations],
        total=len(recommendations)
    )


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get a specific recommendation by ID.
    
    Verifies that the recommendation belongs to a profile owned by the current user.
    """
    service = get_recommendation_service()
    recommendation = service.get_recommendation_by_id(recommendation_id)
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation {recommendation_id} not found"
        )
    
    # Verify ownership through profile
    profile = profile_repository.get_by_id(session, recommendation.profile_id)
    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this recommendation"
        )
    
    return RecommendationResponse.model_validate(recommendation)


@router.post("/{recommendation_id}/feedback", response_model=RecommendationResponse)
async def submit_feedback(
    recommendation_id: UUID,
    feedback: RecommendationFeedback,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Submit user feedback (rating and comment) for a recommendation.
    
    Feedback is used to improve recommendation quality over time.
    """
    service = get_recommendation_service()
    
    # Get recommendation and verify ownership
    recommendation = service.get_recommendation_by_id(recommendation_id)
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation {recommendation_id} not found"
        )
    
    profile = profile_repository.get_by_id(session, recommendation.profile_id)
    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to provide feedback for this recommendation"
        )
    
    # Submit feedback
    try:
        updated = service.submit_feedback(
            recommendation_id=recommendation_id,
            rating=feedback.feedback_rating,
            comment=feedback.feedback_comment
        )
        return RecommendationResponse.model_validate(updated)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
