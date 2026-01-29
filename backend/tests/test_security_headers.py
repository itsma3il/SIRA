"""Unit tests for security headers middleware."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.security_headers import SecurityHeadersMiddleware


@pytest.fixture
def app_with_security_headers_dev():
    """Create a FastAPI app with security headers (development)."""
    app = FastAPI()
    app.add_middleware(
        SecurityHeadersMiddleware,
        enable_csp=True,
        environment="development"
    )
    
    @app.get("/")
    def root():
        return {"message": "ok"}
    
    return app


@pytest.fixture
def app_with_security_headers_prod():
    """Create a FastAPI app with security headers (production)."""
    app = FastAPI()
    app.add_middleware(
        SecurityHeadersMiddleware,
        enable_csp=True,
        environment="production"
    )
    
    @app.get("/")
    def root():
        return {"message": "ok"}
    
    return app


class TestSecurityHeaders:
    """Tests for security headers middleware."""

    def test_x_content_type_options(self, app_with_security_headers_dev):
        """Test X-Content-Type-Options header is present."""
        client = TestClient(app_with_security_headers_dev)
        response = client.get("/")
        
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"

    def test_x_frame_options(self, app_with_security_headers_dev):
        """Test X-Frame-Options header is present."""
        client = TestClient(app_with_security_headers_dev)
        response = client.get("/")
        
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"

    def test_x_xss_protection(self, app_with_security_headers_dev):
        """Test X-XSS-Protection header is present."""
        client = TestClient(app_with_security_headers_dev)
        response = client.get("/")
        
        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"

    def test_content_security_policy(self, app_with_security_headers_dev):
        """Test Content-Security-Policy header is present and configured."""
        client = TestClient(app_with_security_headers_dev)
        response = client.get("/")
        
        assert "Content-Security-Policy" in response.headers
        csp = response.headers["Content-Security-Policy"]
        
        # Check key directives
        assert "default-src 'self'" in csp
        assert "script-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp

    def test_referrer_policy(self, app_with_security_headers_dev):
        """Test Referrer-Policy header is present."""
        client = TestClient(app_with_security_headers_dev)
        response = client.get("/")
        
        assert "Referrer-Policy" in response.headers
        assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

    def test_permissions_policy(self, app_with_security_headers_dev):
        """Test Permissions-Policy header is present."""
        client = TestClient(app_with_security_headers_dev)
        response = client.get("/")
        
        assert "Permissions-Policy" in response.headers
        permissions = response.headers["Permissions-Policy"]
        
        # Check some disabled features
        assert "camera=()" in permissions
        assert "microphone=()" in permissions
        assert "geolocation=()" in permissions

    def test_hsts_in_production(self, app_with_security_headers_prod):
        """Test HSTS header is present in production."""
        client = TestClient(app_with_security_headers_prod)
        response = client.get("/")
        
        assert "Strict-Transport-Security" in response.headers
        hsts = response.headers["Strict-Transport-Security"]
        assert "max-age=31536000" in hsts
        assert "includeSubDomains" in hsts

    def test_no_hsts_in_development(self, app_with_security_headers_dev):
        """Test HSTS header is not present in development."""
        client = TestClient(app_with_security_headers_dev)
        response = client.get("/")
        
        assert "Strict-Transport-Security" not in response.headers

    def test_csp_can_be_disabled(self):
        """Test CSP can be disabled."""
        app = FastAPI()
        app.add_middleware(
            SecurityHeadersMiddleware,
            enable_csp=False,
            environment="development"
        )
        
        @app.get("/")
        def root():
            return {"message": "ok"}
        
        client = TestClient(app)
        response = client.get("/")
        
        # CSP should not be present when disabled
        assert "Content-Security-Policy" not in response.headers
