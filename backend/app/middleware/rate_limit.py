"""Rate limiting middleware for API protection."""
import time
from collections import defaultdict
from typing import Callable

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware.
    
    For production, consider using Redis-backed rate limiting like slowapi
    with Redis backend for distributed systems.
    
    Configuration:
    - requests_per_minute: Number of requests allowed per IP per minute
    - requests_per_hour: Number of requests allowed per IP per hour
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        exclude_paths: list[str] | None = None,
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.exclude_paths = exclude_paths or ["/health", "/", "/docs", "/openapi.json"]
        
        # Store request timestamps per IP
        # Format: {ip: [(timestamp, 'minute'|'hour')]}
        self._requests: dict[str, list[tuple[float, str]]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request headers or connection."""
        # Check for proxied IP first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        if request.client:
            return request.client.host
        
        return "unknown"

    def _cleanup_old_requests(self, ip: str, current_time: float) -> None:
        """Remove requests older than 1 hour to prevent memory bloat."""
        if ip in self._requests:
            # Keep only requests from the last hour
            self._requests[ip] = [
                (ts, period) for ts, period in self._requests[ip]
                if current_time - ts < 3600
            ]
            # Clean up empty entries
            if not self._requests[ip]:
                del self._requests[ip]

    def _is_rate_limited(self, ip: str) -> tuple[bool, str]:
        """
        Check if IP is rate limited.
        
        Returns:
            tuple: (is_limited: bool, reason: str)
        """
        current_time = time.time()
        
        # Cleanup old requests
        self._cleanup_old_requests(ip, current_time)
        
        if ip not in self._requests:
            return False, ""
        
        requests = self._requests[ip]
        
        # Count requests in the last minute
        minute_requests = sum(
            1 for ts, _ in requests
            if current_time - ts < 60
        )
        if minute_requests >= self.requests_per_minute:
            return True, f"Rate limit exceeded: {self.requests_per_minute} requests per minute"
        
        # Count requests in the last hour
        hour_requests = len(requests)
        if hour_requests >= self.requests_per_hour:
            return True, f"Rate limit exceeded: {self.requests_per_hour} requests per hour"
        
        return False, ""

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request and enforce rate limits."""
        # Skip rate limiting for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Check rate limit
        is_limited, reason = self._is_rate_limited(client_ip)
        if is_limited:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=reason,
                headers={"Retry-After": "60"},
            )
        
        # Record this request
        current_time = time.time()
        self._requests[client_ip].append((current_time, "request"))
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        minute_remaining = self.requests_per_minute - sum(
            1 for ts, _ in self._requests[client_ip]
            if current_time - ts < 60
        )
        hour_remaining = self.requests_per_hour - len(self._requests[client_ip])
        
        response.headers["X-RateLimit-Limit-Minute"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining-Minute"] = str(max(0, minute_remaining))
        response.headers["X-RateLimit-Limit-Hour"] = str(self.requests_per_hour)
        response.headers["X-RateLimit-Remaining-Hour"] = str(max(0, hour_remaining))
        
        return response
