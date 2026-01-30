"""Pytest configuration and fixtures."""
import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.main import create_app
from app.db import Base
from app.core.config import get_settings


# Test database URL (use in-memory SQLite for fast tests)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},  # Needed for SQLite
        poolclass=None,  # Disable pooling for in-memory DB
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_db(test_engine) -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    TestSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine
    )
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="module")
def test_client() -> Generator[TestClient, None, None]:
    """Create a test client for API testing."""
    app = create_app()
    with TestClient(app) as client:
        yield client


@pytest.fixture
def test_session(test_db) -> Generator[Session, None, None]:
    """Alias for test_db fixture for compatibility."""
    yield test_db


@pytest.fixture
def mock_auth_token() -> str:
    """Mock JWT token for testing authenticated endpoints."""
    return "mock_bearer_token"


@pytest.fixture
def mock_user_id() -> str:
    """Mock user ID for testing."""
    return "user_123456"


@pytest.fixture
def authenticated_client(test_client, monkeypatch) -> TestClient:
    """Create test client with mocked authentication."""
    from app.core.security import verify_clerk_token
    
    # Mock the verify_clerk_token function to always return a valid user
    def mock_verify_token(token: str):
        return {
            "sub": "user_test_123",
            "email": "test@example.com",
            "user_id": "clerk_user_123"
        }
    
    monkeypatch.setattr("app.core.security.verify_clerk_token", mock_verify_token)
    return test_client


@pytest.fixture
def sample_profile_data() -> dict:
    """Sample profile data for testing."""
    return {
        "profile_name": "Computer Science Track",
        "status": "draft",
        "academic_record": {
            "current_status": "High School",
            "current_institution": "Test High School",
            "current_field": "Science",
            "gpa": 15.5,
            "language_preference": "English",
            "subject_grades": [
                {"subject_name": "Mathematics", "grade": 18.5, "weight": 4.0},
                {"subject_name": "Physics", "grade": 17.0, "weight": 3.0},
            ]
        },
        "preferences": {
            "favorite_subjects": ["Mathematics", "Computer Science"],
            "geographic_preference": "Europe",
            "budget_range_min": 5000,
            "budget_range_max": 15000,
        }
    }


@pytest.fixture(autouse=True)
def reset_rate_limit():
    """Reset rate limit state between tests."""
    # This would reset the in-memory rate limit counter
    # Implementation depends on how rate limiting is structured
    yield


@pytest.fixture
def temp_upload_dir(tmp_path):
    """Create a temporary upload directory for testing."""
    upload_dir = tmp_path / "uploads" / "transcripts"
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir
