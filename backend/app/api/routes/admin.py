"""Admin API routes for monitoring and analytics."""
import logging
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.api.deps import get_session as get_db_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.recommendation import Recommendation
from app.models.conversation import ConversationSession, ConversationMessage
from app.schemas.admin import (
    DashboardMetrics,
    ProfileListItem,
    SessionListItem,
    RecommendationListItem,
    RecommendationAnalytics
)
from app.services.feedback_service import get_feedback_analytics

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)


def is_admin(user: User) -> bool:
    """Check if user has admin privileges."""
    # TODO: Implement proper admin role checking
    # For now, you can hardcode admin emails or add an is_admin field to User model
    admin_emails = ["admin@sira.com", "ismail@sira.com", "signmousdik@gmail.com"]  # Update with your admin emails
    return user.email in admin_emails


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to verify admin access."""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db_session)
):
    """
    Get dashboard metrics for admin overview.
    
    Returns statistics on users, profiles, recommendations, and feedback.
    """
    try:
        # Calculate date range
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total counts
        total_users = db.query(func.count(User.id)).scalar()
        total_profiles = db.query(func.count(Profile.id)).scalar()
        total_recommendations = db.query(func.count(Recommendation.id)).scalar()
        total_sessions = db.query(func.count(ConversationSession.id)).scalar()
        
        # New registrations in period
        new_users = db.query(func.count(User.id)).filter(
            User.created_at >= start_date
        ).scalar()
        
        # Recommendations with feedback
        recommendations_with_feedback = db.query(func.count(Recommendation.id)).filter(
            Recommendation.feedback_rating.isnot(None)
        ).scalar()
        
        # Average feedback rating
        avg_rating_result = db.query(func.avg(Recommendation.feedback_rating)).filter(
            Recommendation.feedback_rating.isnot(None)
        ).scalar()
        avg_feedback_rating = float(avg_rating_result) if avg_rating_result else 0.0
        
        # Most recommended programs (from structured_data)
        recommendations_with_data = db.query(Recommendation.structured_data).filter(
            Recommendation.structured_data.isnot(None),
            Recommendation.created_at >= start_date
        ).all()
        
        # Extract program names from structured data
        program_counts = {}
        for rec in recommendations_with_data:
            if rec.structured_data and "program_names" in rec.structured_data:
                for program in rec.structured_data["program_names"]:
                    program_counts[program] = program_counts.get(program, 0) + 1
        
        # Get top 10 programs
        top_programs = [
            {"program": program, "count": count}
            for program, count in sorted(program_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Low-rated recommendations (rating <= 2)
        low_rated_count = db.query(func.count(Recommendation.id)).filter(
            Recommendation.feedback_rating <= 2,
            Recommendation.feedback_rating.isnot(None)
        ).scalar()
        
        # Active users (users with activity in last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        active_users = db.query(func.count(func.distinct(ConversationSession.user_id))).filter(
            ConversationSession.created_at >= seven_days_ago
        ).scalar()
        
        return DashboardMetrics(
            total_users=total_users,
            new_users_period=new_users,
            active_users=active_users,
            total_profiles=total_profiles,
            total_recommendations=total_recommendations,
            total_sessions=total_sessions,
            recommendations_with_feedback=recommendations_with_feedback,
            avg_feedback_rating=round(avg_feedback_rating, 2),
            top_recommended_programs=top_programs,
            low_rated_recommendations_count=low_rated_count,
            period_days=days
        )
        
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get dashboard metrics")


@router.get("/profiles", response_model=list[ProfileListItem])
async def list_all_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db_session)
):
    """List all profiles across all users for admin review."""
    try:
        query = db.query(Profile)
        
        if status:
            query = query.filter(Profile.status == status)
        
        profiles = query.order_by(desc(Profile.created_at)).offset(skip).limit(limit).all()
        
        return [
            ProfileListItem(
                id=p.id,
                user_id=p.user_id,
                profile_name=p.profile_name,
                status=p.status,
                created_at=p.created_at,
                updated_at=p.updated_at,
                current_education_level=p.academic_record.current_status if p.academic_record else None,
                current_field=p.academic_record.current_field if p.academic_record else None,
                target_field=p.preferences.career_goals[:50] if p.preferences and p.preferences.career_goals else None,
                user_email=p.user.email if p.user else None
            )
            for p in profiles
        ]
        
    except Exception as e:
        logger.error(f"Error listing profiles: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list profiles")


@router.get("/sessions", response_model=list[SessionListItem])
async def list_all_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db_session)
):
    """List all conversation sessions for admin review."""
    try:
        query = db.query(ConversationSession)
        
        if status:
            query = query.filter(ConversationSession.status == status)
        
        sessions = query.order_by(desc(ConversationSession.created_at)).offset(skip).limit(limit).all()
        
        # Get message counts
        result = []
        for session in sessions:
            message_count = db.query(func.count(ConversationMessage.id)).filter(
                ConversationMessage.session_id == session.id
            ).scalar()
            
            result.append(SessionListItem(
                id=session.id,
                user_id=session.user_id,
                title=session.title,
                status=session.status,
                created_at=session.created_at,
                updated_at=session.updated_at,
                message_count=message_count,
                user_email=session.user.email if session.user else None,
                profile_name=session.profile.profile_name if session.profile else None
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list sessions")


@router.get("/recommendations", response_model=list[RecommendationListItem])
async def list_all_recommendations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    min_rating: Optional[int] = Query(None, ge=1, le=5),
    max_rating: Optional[int] = Query(None, ge=1, le=5),
    has_feedback: Optional[bool] = Query(None),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db_session)
):
    """List all recommendations with optional filters."""
    try:
        query = db.query(Recommendation)
        
        if min_rating is not None:
            query = query.filter(Recommendation.feedback_rating >= min_rating)
        
        if max_rating is not None:
            query = query.filter(Recommendation.feedback_rating <= max_rating)
        
        if has_feedback is not None:
            if has_feedback:
                query = query.filter(Recommendation.feedback_rating.isnot(None))
            else:
                query = query.filter(Recommendation.feedback_rating.is_(None))
        
        recommendations = query.order_by(desc(Recommendation.created_at)).offset(skip).limit(limit).all()
        
        return [
            RecommendationListItem(
                id=rec.id,
                profile_id=rec.profile_id,
                session_id=rec.session_id,
                created_at=rec.created_at,
                feedback_rating=rec.feedback_rating,
                feedback_comment=rec.feedback_comment,
                user_email=rec.profile.user.email if rec.profile and rec.profile.user else None,
                profile_name=rec.profile.profile_name if rec.profile else None,
                program_count=len(rec.structured_data.get("program_names", [])) if rec.structured_data else 0
            )
            for rec in recommendations
        ]
        
    except Exception as e:
        logger.error(f"Error listing recommendations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list recommendations")


@router.get("/recommendations/{recommendation_id}/analytics", response_model=RecommendationAnalytics)
async def get_recommendation_analytics(
    recommendation_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db_session)
):
    """Get detailed analytics for a specific recommendation."""
    try:
        recommendation = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
        
        if not recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        # Extract data for analytics
        programs = []
        if recommendation.structured_data and "program_names" in recommendation.structured_data:
            program_names = recommendation.structured_data.get("program_names", [])
            match_scores = recommendation.structured_data.get("match_scores", [])
            
            for i, name in enumerate(program_names):
                programs.append({
                    "name": name,
                    "match_score": match_scores[i] if i < len(match_scores) else None
                })
        
        return RecommendationAnalytics(
            id=recommendation.id,
            profile_id=recommendation.profile_id,
            session_id=recommendation.session_id,
            query=recommendation.query,
            retrieved_context=recommendation.retrieved_context,
            ai_response=recommendation.ai_response,
            structured_data=recommendation.structured_data,
            created_at=recommendation.created_at,
            feedback_rating=recommendation.feedback_rating,
            feedback_comment=recommendation.feedback_comment,
            profile_name=recommendation.profile.profile_name if recommendation.profile else None,
            user_email=recommendation.profile.user.email if recommendation.profile and recommendation.profile.user else None,
            programs=programs
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendation analytics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get recommendation analytics")


@router.get("/feedback/trends")
async def get_feedback_trends(
    days: int = Query(30, ge=1, le=365),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db_session)
):
    """Get feedback trends and statistics."""
    try:
        analytics = get_feedback_analytics(db)
        trends = analytics.get_feedback_trends(days=days)
        return trends
    except Exception as e:
        logger.error(f"Error getting feedback trends: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get feedback trends")


@router.get("/feedback/low-rated")
async def get_low_rated_recommendations(
    threshold: int = Query(2, ge=1, le=5),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db_session)
):
    """Get recommendations with low ratings for quality review."""
    try:
        analytics = get_feedback_analytics(db)
        low_rated = analytics.get_low_rated_recommendations(threshold=threshold, limit=limit)
        
        return [
            {
                "id": str(rec.id),
                "profile_id": str(rec.profile_id),
                "session_id": str(rec.session_id) if rec.session_id else None,
                "created_at": rec.created_at.isoformat() if rec.created_at else None,
                "feedback_rating": rec.feedback_rating,
                "feedback_comment": rec.feedback_comment,
                "profile_name": rec.profile.profile_name if rec.profile else None,
                "user_email": rec.profile.user.email if rec.profile and rec.profile.user else None
            }
            for rec in low_rated
        ]
    except Exception as e:
        logger.error(f"Error getting low-rated recommendations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get low-rated recommendations")


@router.get("/feedback/improvement-areas")
async def get_improvement_areas(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db_session)
):
    """Identify areas for improvement based on feedback analysis."""
    try:
        analytics = get_feedback_analytics(db)
        areas = analytics.identify_improvement_areas()
        return areas
    except Exception as e:
        logger.error(f"Error analyzing improvement areas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze improvement areas")
