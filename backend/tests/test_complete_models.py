"""Comprehensive test for all database models with SQLAlchemy."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_engine, Base
from app.models.user import User
from app.models.profile import Profile, AcademicRecord, SubjectGrade, StudentPreferences


def test_complete_models():
    """Test all models with relationships and PostgreSQL-specific types."""
    engine = get_engine()
    
    # Ensure tables exist
    Base.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Create user
        user = User(
            clerk_user_id=f"test_clerk_{uuid4().hex[:8]}",
            email=f"test_{uuid4().hex[:8]}@example.com"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        print(f"✅ User created: {user.email}")
        
        # Create profile with JSONB
        profile = Profile(
            user_id=user.id,
            profile_name="Full Computer Science Profile",
            status="active",
            draft_payload={
                "wizard_step": 3,
                "notes": "Testing JSONB field",
                "metadata": {"version": 1}
            }
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)
        
        print(f"✅ Profile created: {profile.profile_name}")
        print(f"   - Draft payload: {profile.draft_payload}")
        
        # Create academic record
        academic_record = AcademicRecord(
            profile_id=profile.id,
            current_status="Undergraduate",
            current_institution="MIT",
            current_field="Computer Science",
            gpa=3.85,
            language_preference="English"
        )
        session.add(academic_record)
        session.commit()
        session.refresh(academic_record)
        
        print(f"✅ Academic record created: {academic_record.current_institution}")
        
        # Create subject grades
        subjects = [
            ("Algorithms", 95.0, 4.0),
            ("Data Structures", 92.0, 3.0),
            ("Machine Learning", 88.0, 3.0),
        ]
        
        for subject_name, grade, weight in subjects:
            subject_grade = SubjectGrade(
                academic_record_id=academic_record.id,
                subject_name=subject_name,
                grade=grade,
                weight=weight
            )
            session.add(subject_grade)
        
        session.commit()
        print(f"✅ Created {len(subjects)} subject grades")
        
        # Create student preferences with ARRAY fields
        preferences = StudentPreferences(
            profile_id=profile.id,
            favorite_subjects=["AI", "Machine Learning", "Algorithms"],
            disliked_subjects=["History", "Literature"],
            soft_skills=["Leadership", "Teamwork", "Problem Solving"],
            hobbies=["Coding", "Chess", "Reading"],
            geographic_preference="USA",
            budget_range_min=20000,
            budget_range_max=60000,
            career_goals="Become an AI research scientist"
        )
        session.add(preferences)
        session.commit()
        session.refresh(preferences)
        
        print(f"✅ Preferences created with arrays:")
        print(f"   - Favorite subjects: {preferences.favorite_subjects}")
        print(f"   - Soft skills: {preferences.soft_skills}")
        
        # Test relationship loading
        session.refresh(profile)
        print(f"\n✅ Testing relationships:")
        print(f"   - Profile has academic record: {profile.academic_record is not None}")
        print(f"   - Profile has preferences: {profile.preferences is not None}")
        print(f"   - Academic record has {len(profile.academic_record.subject_grades)} subject grades")
        
        # Test queries
        stmt = select(User).where(User.id == user.id)
        retrieved_user = session.execute(stmt).scalar_one()
        print(f"\n✅ Query test:")
        print(f"   - Retrieved user: {retrieved_user.email}")
        print(f"   - User has {len(retrieved_user.profiles)} profile(s)")
        
        # Test updating JSONB field
        profile.draft_payload["wizard_step"] = 4
        profile.draft_payload["completed"] = True
        session.commit()
        session.refresh(profile)
        print(f"\n✅ JSONB update test:")
        print(f"   - Updated payload: {profile.draft_payload}")
        
        # Cleanup
        print(f"\n🧹 Cleaning up test data...")
        for subject_grade in academic_record.subject_grades:
            session.delete(subject_grade)
        session.delete(preferences)
        session.delete(academic_record)
        session.delete(profile)
        session.delete(user)
        session.commit()
        
        print(f"✅ Cleanup complete!")
    
    print(f"\n🎉 All comprehensive tests PASSED!")
    return True


if __name__ == "__main__":
    try:
        success = test_complete_models()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test FAILED with error:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
