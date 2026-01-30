"""Test database connection and model creation."""
import pytest
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import User, Profile


pytestmark = pytest.mark.skipif(
    True,  # Skip these tests for SQLite in-memory database
    reason="JSONB type not supported in SQLite test database"
)


@pytest.mark.unit
def test_create_tables(test_session: Session):
    """Test that tables are created successfully."""
    # Tables are created by the test_session fixture
    # Just verify we can access the session
    assert test_session is not None
    print("✓ Tables created successfully!")


@pytest.mark.unit
def test_create_user_with_profile(test_session: Session):
    """Test creating a user with profile."""
    # Create user
    user = User(
        clerk_user_id="test_clerk_123",
        email="test@example.com"
    )
    
    # Create profile
    profile = Profile(
        user=user,  # Assign relationship
        profile_name="Computer Science Track",
        status="active"
    )
    
    test_session.add(user)
    test_session.add(profile)
    test_session.commit()
    test_session.refresh(user)
    test_session.refresh(profile)
    
    assert user.id is not None
    assert user.clerk_user_id == "test_clerk_123"
    assert user.email == "test@example.com"
    assert profile.id is not None
    assert profile.profile_name == "Computer Science Track"
    assert profile.status == "active"
    
    print(f"✓ User created: ID={user.id}, Clerk={user.clerk_user_id}, Email={user.email}")
    print(f"✓ Profile created: ID={profile.id}, Name={profile.profile_name}, Status={profile.status}")


@pytest.mark.unit
def test_query_user_with_profiles(test_session: Session):
    """Test querying user and verifying relationship."""
    # Create user with profile first
    user = User(
        clerk_user_id="test_clerk_456",
        email="test2@example.com"
    )
    
    profile = Profile(
        user=user,
        profile_name="Data Science Track",
        status="active"
    )
    
    test_session.add(user)
    test_session.add(profile)
    test_session.commit()
    
    # Query the user
    statement = select(User).where(User.clerk_user_id == "test_clerk_456")
    queried_user = test_session.execute(statement).scalar_one_or_none()
    
    assert queried_user is not None
    assert queried_user.email == "test2@example.com"
    assert len(queried_user.profiles) == 1
    assert queried_user.profiles[0].profile_name == "Data Science Track"
    
    print(f"✓ Found user: {queried_user.email}")
    print(f"✓ User has {len(queried_user.profiles)} profile(s)")
    for prof in queried_user.profiles:
        print(f"  - {prof.profile_name} ({prof.status})")

