"""Test database connection and model creation."""
import sys
sys.path.insert(0, "/app")

from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db import get_engine, Base
from app.models import User, Profile

# Get engine
engine = get_engine()

# Test 1: Create tables
print("Creating tables...")
Base.metadata.create_all(engine)
print("✓ Tables created successfully!")

# Test 2: Create a user with profile
print("\nCreating user with profile...")
with Session(engine) as session:
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
    
    session.add(user)
    session.add(profile)
    session.commit()
    session.refresh(user)
    session.refresh(profile)
    
    print(f"✓ User created: ID={user.id}, Clerk={user.clerk_user_id}, Email={user.email}")
    print(f"✓ Profile created: ID={profile.id}, Name={profile.profile_name}, Status={profile.status}")

# Test 3: Query and verify relationship
print("\nQuerying user and profiles...")
with Session(engine) as session:
    statement = select(User).where(User.clerk_user_id == "test_clerk_123")
    user = session.execute(statement).scalar_one_or_none()
    
    if user:
        print(f"✓ Found user: {user.email}")
        print(f"✓ User has {len(user.profiles)} profile(s)")
        for prof in user.profiles:
            print(f"  - {prof.profile_name} ({prof.status})")
    else:
        print("✗ User not found!")

print("\n✅ All tests passed!")
