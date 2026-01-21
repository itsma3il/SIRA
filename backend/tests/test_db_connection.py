"""Test script to verify backend-database connection by creating a user with a profile."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_engine
from app.models.user import User
from app.models.profile import Profile

def test_create_user_with_profile():
    """Create a test user with a profile to verify database connection."""
    engine = get_engine()
    
    # Generate unique test data
    test_clerk_id = f"test_clerk_{uuid4().hex[:8]}"
    test_email = f"test_{uuid4().hex[:8]}@example.com"
    
    print(f"🔄 Creating test user with clerk_id: {test_clerk_id}")
    
    with Session(engine) as session:
        # Create user
        user = User(
            clerk_user_id=test_clerk_id,
            email=test_email
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        print(f"✅ User created successfully!")
        print(f"   - ID: {user.id}")
        print(f"   - Clerk ID: {user.clerk_user_id}")
        print(f"   - Email: {user.email}")
        print(f"   - Created at: {user.created_at}")
        
        # Create profile for the user
        profile = Profile(
            user_id=user.id,
            profile_name="Computer Science Track",
            status="active",
            draft_payload={"notes": "Test profile for database connection"}
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)
        
        print(f"\n✅ Profile created successfully!")
        print(f"   - ID: {profile.id}")
        print(f"   - Name: {profile.profile_name}")
        print(f"   - Status: {profile.status}")
        print(f"   - User ID: {profile.user_id}")
        
        # Verify relationship works
        session.refresh(user)
        print(f"\n🔗 Relationship verification:")
        print(f"   - User has {len(user.profiles)} profile(s)")
        print(f"   - Profile belongs to user: {profile.user.email}")
        
        # Query to verify data persists
        stmt = select(User).where(User.clerk_user_id == test_clerk_id)
        retrieved_user = session.execute(stmt).scalar_one_or_none()
        
        if retrieved_user:
            print(f"\n✅ Data persistence verified!")
            print(f"   - Retrieved user: {retrieved_user.email}")
            print(f"   - Has {len(retrieved_user.profiles)} profile(s)")
            
            # Clean up test data
            print(f"\n🧹 Cleaning up test data...")
            for profile in retrieved_user.profiles:
                session.delete(profile)
            session.delete(retrieved_user)
            session.commit()
            print(f"✅ Test data cleaned up successfully!")
        else:
            print(f"\n❌ Failed to retrieve user from database!")
            return False
    
    print(f"\n🎉 Database connection test PASSED!")
    return True

if __name__ == "__main__":
    try:
        success = test_create_user_with_profile()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test FAILED with error:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
