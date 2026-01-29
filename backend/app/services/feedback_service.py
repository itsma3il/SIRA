"""Feedback analytics service for quality monitoring."""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_

from app.models.recommendation import Recommendation
from app.models.profile import Profile
from app.services.logging_service import LoggingService

logger = logging.getLogger(__name__)


class FeedbackAnalytics:
    """Service for analyzing feedback and recommendation quality."""
    
    def __init__(self, db: Session):
        self.db = db
        self.logging_service = LoggingService()
    
    def get_average_rating(self, days: Optional[int] = None) -> float:
        """
        Calculate average feedback rating.
        
        Args:
            days: Optional number of days to look back
            
        Returns:
            Average rating (0-5) or 0.0 if no ratings exist
        """
        query = self.db.query(func.avg(Recommendation.feedback_rating)).filter(
            Recommendation.feedback_rating.isnot(None)
        )
        
        if days:
            start_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Recommendation.created_at >= start_date)
        
        result = query.scalar()
        return float(result) if result else 0.0
    
    def get_rating_distribution(self, days: Optional[int] = None) -> Dict[int, int]:
        """
        Get distribution of ratings (1-5 stars).
        
        Returns:
            Dict mapping rating (1-5) to count
        """
        query = self.db.query(
            Recommendation.feedback_rating,
            func.count(Recommendation.id)
        ).filter(
            Recommendation.feedback_rating.isnot(None)
        ).group_by(Recommendation.feedback_rating)
        
        if days:
            start_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Recommendation.created_at >= start_date)
        
        results = query.all()
        
        # Initialize all ratings with 0
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating, count in results:
            if rating and 1 <= rating <= 5:
                distribution[int(rating)] = count
        
        return distribution
    
    def get_low_rated_recommendations(
        self,
        threshold: int = 2,
        limit: int = 50
    ) -> List[Recommendation]:
        """
        Get recommendations with low ratings for quality review.
        
        Args:
            threshold: Maximum rating to consider (default: 2 stars or below)
            limit: Maximum number of results
            
        Returns:
            List of low-rated recommendations
        """
        recommendations = self.db.query(Recommendation).filter(
            and_(
                Recommendation.feedback_rating.isnot(None),
                Recommendation.feedback_rating <= threshold
            )
        ).order_by(desc(Recommendation.created_at)).limit(limit).all()
        
        return recommendations
    
    def get_feedback_trends(self, days: int = 30) -> Dict[str, Any]:
        """
        Get feedback trends over time.
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Dict containing trend data
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total feedback count
        total_feedback = self.db.query(func.count(Recommendation.id)).filter(
            and_(
                Recommendation.feedback_rating.isnot(None),
                Recommendation.created_at >= start_date
            )
        ).scalar()
        
        # Total recommendations in period
        total_recommendations = self.db.query(func.count(Recommendation.id)).filter(
            Recommendation.created_at >= start_date
        ).scalar()
        
        # Feedback rate
        feedback_rate = (total_feedback / total_recommendations * 100) if total_recommendations > 0 else 0
        
        # Average rating
        avg_rating = self.get_average_rating(days=days)
        
        # Rating distribution
        distribution = self.get_rating_distribution(days=days)
        
        # Positive feedback (4-5 stars)
        positive_count = distribution[4] + distribution[5]
        positive_rate = (positive_count / total_feedback * 100) if total_feedback > 0 else 0
        
        # Negative feedback (1-2 stars)
        negative_count = distribution[1] + distribution[2]
        negative_rate = (negative_count / total_feedback * 100) if total_feedback > 0 else 0
        
        return {
            "period_days": days,
            "total_recommendations": total_recommendations,
            "total_feedback": total_feedback,
            "feedback_rate": round(feedback_rate, 2),
            "average_rating": round(avg_rating, 2),
            "rating_distribution": distribution,
            "positive_feedback_count": positive_count,
            "positive_feedback_rate": round(positive_rate, 2),
            "negative_feedback_count": negative_count,
            "negative_feedback_rate": round(negative_rate, 2)
        }
    
    def get_recommendation_quality_metrics(
        self,
        recommendation_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """
        Get quality metrics for a specific recommendation.
        
        Returns:
            Dict with quality metrics or None if not found
        """
        rec = self.db.query(Recommendation).filter(
            Recommendation.id == recommendation_id
        ).first()
        
        if not rec:
            return None
        
        # Extract metrics from structured data
        metrics = {
            "recommendation_id": str(rec.id),
            "profile_id": str(rec.profile_id),
            "session_id": str(rec.session_id) if rec.session_id else None,
            "created_at": rec.created_at.isoformat() if rec.created_at else None,
            "has_feedback": rec.feedback_rating is not None,
            "feedback_rating": rec.feedback_rating,
            "feedback_comment": rec.feedback_comment,
            "has_structured_data": rec.structured_data is not None,
            "has_retrieved_context": rec.retrieved_context is not None,
        }
        
        # Add context metrics if available
        if rec.retrieved_context:
            metrics["num_retrieved_docs"] = len(rec.retrieved_context.get("documents", []))
            scores = [doc.get("score", 0) for doc in rec.retrieved_context.get("documents", [])]
            if scores:
                metrics["avg_retrieval_score"] = round(sum(scores) / len(scores), 4)
                metrics["max_retrieval_score"] = round(max(scores), 4)
                metrics["min_retrieval_score"] = round(min(scores), 4)
        
        return metrics
    
    def identify_improvement_areas(self) -> Dict[str, Any]:
        """
        Identify areas for improvement based on feedback analysis.
        
        Returns:
            Dict with recommendations for improvement
        """
        # Get recent low-rated recommendations
        low_rated = self.get_low_rated_recommendations(threshold=2, limit=20)
        
        # Analyze common patterns
        issues = []
        
        # Check for retrieval issues (low scores)
        low_retrieval_count = 0
        for rec in low_rated:
            if rec.retrieved_context:
                docs = rec.retrieved_context.get("documents", [])
                if docs and max(doc.get("score", 0) for doc in docs) < 0.5:
                    low_retrieval_count += 1
        
        if low_retrieval_count > len(low_rated) * 0.3:  # More than 30%
            issues.append({
                "area": "retrieval_quality",
                "severity": "high",
                "description": "Many low-rated recommendations have poor retrieval scores",
                "suggestion": "Consider improving query construction or adding more diverse data to vector DB"
            })
        
        # Check average rating
        avg_rating = self.get_average_rating(days=30)
        if avg_rating < 3.5:
            issues.append({
                "area": "overall_quality",
                "severity": "high",
                "description": f"Average rating is low: {avg_rating:.2f}/5.0",
                "suggestion": "Review prompt engineering and recommendation logic"
            })
        
        # Check feedback rate
        trends = self.get_feedback_trends(days=30)
        if trends["feedback_rate"] < 20:  # Less than 20%
            issues.append({
                "area": "feedback_collection",
                "severity": "medium",
                "description": f"Low feedback rate: {trends['feedback_rate']:.1f}%",
                "suggestion": "Encourage users to provide feedback with better UI prompts"
            })
        
        return {
            "total_issues_identified": len(issues),
            "issues": issues,
            "low_rated_sample_size": len(low_rated),
            "analysis_date": datetime.utcnow().isoformat()
        }
    
    def log_feedback_submission(
        self,
        recommendation_id: UUID,
        rating: int,
        comment: Optional[str],
        user_id: str
    ):
        """Log feedback submission for monitoring."""
        self.logging_service.log_user_feedback(
            recommendation_id=str(recommendation_id),
            rating=rating,
            comment=comment,
            user_id=user_id
        )
        
        logger.info(
            f"Feedback submitted: recommendation_id={recommendation_id}, "
            f"rating={rating}, user_id={user_id}"
        )


def get_feedback_analytics(db: Session) -> FeedbackAnalytics:
    """Dependency to get feedback analytics service."""
    return FeedbackAnalytics(db)
