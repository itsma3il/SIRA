"""Enhanced logging service for quality monitoring."""
import logging
import time
from typing import Optional, Dict, Any
from functools import wraps
from datetime import datetime

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


class LoggingService:
    """Service for comprehensive system logging."""
    
    @staticmethod
    def log_llm_call(
        model: str,
        prompt_length: int,
        response_length: int,
        latency_ms: float,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log LLM API calls with performance metrics."""
        logger.info(
            "LLM_CALL",
            extra={
                "event_type": "llm_call",
                "model": model,
                "prompt_length": prompt_length,
                "response_length": response_length,
                "latency_ms": latency_ms,
                "user_id": user_id,
                "metadata": metadata or {},
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def log_retrieval_query(
        query: str,
        num_results: int,
        top_score: Optional[float] = None,
        latency_ms: Optional[float] = None,
        user_id: Optional[str] = None
    ):
        """Log vector database retrieval queries."""
        logger.info(
            "RETRIEVAL_QUERY",
            extra={
                "event_type": "retrieval",
                "query": query[:200],  # Truncate long queries
                "num_results": num_results,
                "top_score": top_score,
                "latency_ms": latency_ms,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def log_user_feedback(
        recommendation_id: str,
        rating: int,
        comment: Optional[str],
        user_id: str
    ):
        """Log user feedback submissions."""
        logger.info(
            "USER_FEEDBACK",
            extra={
                "event_type": "feedback",
                "recommendation_id": recommendation_id,
                "rating": rating,
                "has_comment": bool(comment),
                "comment_length": len(comment) if comment else 0,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def log_recommendation_generation(
        profile_id: str,
        session_id: str,
        num_programs: int,
        generation_time_ms: float,
        user_id: str
    ):
        """Log recommendation generation events."""
        logger.info(
            "RECOMMENDATION_GENERATED",
            extra={
                "event_type": "recommendation",
                "profile_id": profile_id,
                "session_id": session_id,
                "num_programs": num_programs,
                "generation_time_ms": generation_time_ms,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    def log_error(
        error_type: str,
        error_message: str,
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ):
        """Log application errors with context."""
        logger.error(
            "APPLICATION_ERROR",
            extra={
                "event_type": "error",
                "error_type": error_type,
                "error_message": error_message,
                "context": context or {},
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            },
            exc_info=True
        )


def log_execution_time(operation_name: str):
    """Decorator to log execution time of functions."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                elapsed_ms = (time.time() - start_time) * 1000
                logger.info(f"{operation_name} completed in {elapsed_ms:.2f}ms")
                return result
            except Exception as e:
                elapsed_ms = (time.time() - start_time) * 1000
                logger.error(f"{operation_name} failed after {elapsed_ms:.2f}ms: {str(e)}")
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                elapsed_ms = (time.time() - start_time) * 1000
                logger.info(f"{operation_name} completed in {elapsed_ms:.2f}ms")
                return result
            except Exception as e:
                elapsed_ms = (time.time() - start_time) * 1000
                logger.error(f"{operation_name} failed after {elapsed_ms:.2f}ms: {str(e)}")
                raise
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Global logging service instance
logging_service = LoggingService()
