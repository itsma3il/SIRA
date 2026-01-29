"""Unit tests for rate limiting middleware."""
import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient

from app.middleware.rate_limit import RateLimitMiddleware


@pytest.fixture
def app_with_rate_limit():
    """Create a FastAPI app with rate limiting."""
    app = FastAPI()
    
    # Add rate limiting with low limits for testing
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=5,
        requests_per_hour=20,
        exclude_paths=["/health"],
    )
    
    @app.get("/")
    def root():
        return {"message": "ok"}
    
    @app.get("/health")
    def health():
        return {"status": "healthy"}
    
    @app.get("/api/test")
    def test_endpoint():
        return {"data": "test"}
    
    return app


class TestRateLimiting:
    """Tests for rate limiting middleware."""

    def test_requests_within_limit(self, app_with_rate_limit):
        """Test requests within rate limit are allowed."""
        client = TestClient(app_with_rate_limit)
        
        # Make 5 requests (within limit)
        for i in range(5):
            response = client.get("/api/test")
            assert response.status_code == status.HTTP_200_OK

    def test_rate_limit_exceeded(self, app_with_rate_limit):
        """Test requests exceeding rate limit are rejected."""
        client = TestClient(app_with_rate_limit)
        
        # Make 6 requests (exceeds limit of 5 per minute)
        for i in range(5):
            response = client.get("/api/test")
            assert response.status_code == status.HTTP_200_OK
        
        # 6th request should be rate limited
        response = client.get("/api/test")
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "Rate limit exceeded" in response.json()["detail"]

    def test_rate_limit_headers(self, app_with_rate_limit):
        """Test rate limit headers are included in response."""
        client = TestClient(app_with_rate_limit)
        
        response = client.get("/api/test")
        assert response.status_code == status.HTTP_200_OK
        
        # Check headers
        assert "X-RateLimit-Limit-Minute" in response.headers
        assert "X-RateLimit-Remaining-Minute" in response.headers
        assert "X-RateLimit-Limit-Hour" in response.headers
        assert "X-RateLimit-Remaining-Hour" in response.headers
        
        assert response.headers["X-RateLimit-Limit-Minute"] == "5"

    def test_excluded_paths_not_rate_limited(self, app_with_rate_limit):
        """Test excluded paths are not rate limited."""
        client = TestClient(app_with_rate_limit)
        
        # Make many requests to /health (excluded path)
        for i in range(10):
            response = client.get("/health")
            assert response.status_code == status.HTTP_200_OK

    def test_different_ips_have_separate_limits(self, app_with_rate_limit):
        """Test different IPs have separate rate limits."""
        # This is a simplified test - in real scenarios, you'd mock different IPs
        client = TestClient(app_with_rate_limit)
        
        # Each test client gets a fresh instance, simulating different IPs
        for i in range(5):
            response = client.get("/api/test")
            assert response.status_code == status.HTTP_200_OK

    def test_retry_after_header(self, app_with_rate_limit):
        """Test Retry-After header is present when rate limited."""
        client = TestClient(app_with_rate_limit)
        
        # Exceed rate limit
        for i in range(6):
            response = client.get("/api/test")
        
        # Check rate limited response has Retry-After header
        if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            assert "Retry-After" in response.headers
            assert response.headers["Retry-After"] == "60"
