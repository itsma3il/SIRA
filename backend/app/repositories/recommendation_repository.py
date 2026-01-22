"""Recommendation repository for database access."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.recommendation import Recommendation
from app.models.profile import Profile


def get_by_id(session: Session, recommendation_id: UUID) -> Optional[Recommendation]:
    """Get a recommendation by ID with profile relationship loaded."""
    return session.execute(
        select(Recommendation)
        .options(joinedload(Recommendation.profile))
        .where(Recommendation.id == recommendation_id)
    ).unique().scalar_one_or_none()


def get_by_profile_id(
    session: Session, 
    profile_id: UUID, 
    limit: int = 10
) -> List[Recommendation]:
    """Get all recommendations for a profile, ordered by creation date (newest first)."""
    return list(
        session.execute(
            select(Recommendation)
            .where(Recommendation.profile_id == profile_id)
            .order_by(Recommendation.created_at.desc())
            .limit(limit)
        ).scalars().all()
    )


def create(
    session: Session,
    profile_id: UUID,
    query: str,
    retrieved_context: Optional[List[dict]],
    ai_response: str,
    structured_data: Optional[dict]
) -> Recommendation:
    """Create a new recommendation."""
    recommendation = Recommendation(
        profile_id=profile_id,
        query=query,
        retrieved_context=retrieved_context,
        ai_response=ai_response,
        structured_data=structured_data
    )
    session.add(recommendation)
    session.commit()
    session.refresh(recommendation)
    return recommendation


def update_feedback(
    session: Session,
    recommendation_id: UUID,
    rating: int,
    comment: Optional[str]
) -> Optional[Recommendation]:
    """Update feedback for a recommendation."""
    recommendation = session.get(Recommendation, recommendation_id)
    if not recommendation:
        return None
    
    recommendation.feedback_rating = rating
    recommendation.feedback_comment = comment
    session.commit()
    session.refresh(recommendation)
    return recommendation


def delete(session: Session, recommendation_id: UUID) -> bool:
    """Delete a recommendation."""
    recommendation = session.get(Recommendation, recommendation_id)
    if not recommendation:
        return False
    
    session.delete(recommendation)
    session.commit()
    return True
