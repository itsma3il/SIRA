"""Logging middleware for request/response tracking."""
import logging
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process each request and log key information.
        
        Logs:
        - Request method and path
        - Response status code
        - Request processing time
        - User ID (if authenticated)
        """
        start_time = time.time()
        
        # Extract user info if available
        user_id = None
        if hasattr(request.state, "user"):
            user_id = getattr(request.state.user, "id", None)
        
        # Process request
        response = await call_next(request)
        
        # Calculate elapsed time
        elapsed_ms = (time.time() - start_time) * 1000
        
        # Log request details
        logger.info(
            f"{request.method} {request.url.path}",
            extra={
                "event_type": "http_request",
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(elapsed_ms, 2),
                "user_id": str(user_id) if user_id else None,
                "client_ip": request.client.host if request.client else None,
            }
        )
        
        return response


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to catch and log all unhandled exceptions."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Catch and log any unhandled exceptions."""
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(
                f"Unhandled exception: {str(e)}",
                extra={
                    "event_type": "unhandled_exception",
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                exc_info=True
            )
            raise
