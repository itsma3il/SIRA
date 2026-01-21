"""Test script to verify Profile API endpoints work correctly."""
import json
import sys
from uuid import uuid4

from sqlalchemy.orm import Session

from app.db import get_engine
from app.models.user import User
from app.models.profile import Profile
from app.services import profile_service
from app.schemas.profile import (
    ProfileCreate,
    ProfileUpdate,
    AcademicRecordCreate,
    StudentPreferencesCreate,
    StudentPreferencesUpdate,
    SubjectGradeCreate,
)


def test_profile_services():
    """Test all profile services end-to-end."""
    engine = get_engine()
    
    print("=" * 70)
    print("PROFILE SERVICES TEST")
    print("=" * 70)
    
    with Session(engine) as session:
        # 1. Create a test user
        test_user = User(
            clerk_user_id=f"test_clerk_{uuid4().hex[:8]}",
            email=f"test_{uuid4().hex[:8]}@example.com"
        )
        session.add(test_user)
        session.commit()
        session.refresh(test_user)
        print(f"\n✅ Test user created: {test_user.email}")
        
        # 2. Create a complete profile
        print("\n--- TEST 1: Create Profile with All Data ---")
        profile_data = ProfileCreate(
            profile_name="Computer Science - UM6P Track",
            status="draft",
            draft_payload={
                "wizard_step": 4,
                "completed": False
            },
            academic_record=AcademicRecordCreate(
                current_status="High School Graduate",
                current_institution="Lycée Mohammed V",
                current_field="Science Mathématiques",
                gpa=17.5,
                language_preference="French",
                subject_grades=[
                    SubjectGradeCreate(subject_name="Mathematics", grade=18.0, weight=5.0),
                    SubjectGradeCreate(subject_name="Physics", grade=17.0, weight=4.0),
                    SubjectGradeCreate(subject_name="Computer Science", grade=19.0, weight=3.0),
                ]
            ),
            preferences=StudentPreferencesCreate(
                favorite_subjects=["AI", "Machine Learning", "Algorithms"],
                disliked_subjects=["History", "Literature"],
                soft_skills=["Problem Solving", "Teamwork", "Leadership"],
                hobbies=["Coding", "Chess", "Reading"],
                geographic_preference="Morocco",
                budget_range_min=50000,
                budget_range_max=150000,
                career_goals="Become an AI researcher and contribute to cutting-edge technology"
            )
        )
        
        profile = profile_service.create_profile(
            session=session,
            user_id=test_user.id,
            profile_data=profile_data
        )
        
        print(f"✅ Profile created: {profile.profile_name}")
        print(f"   - ID: {profile.id}")
        print(f"   - Status: {profile.status}")
        print(f"   - Draft payload: {profile.draft_payload}")
        
        if profile.academic_record:
            print(f"   - Academic record: {profile.academic_record.current_institution}")
            print(f"   - GPA: {profile.academic_record.gpa}/20")
            print(f"   - Subject grades: {len(profile.academic_record.subject_grades)} subjects")
            for grade in profile.academic_record.subject_grades:
                print(f"     • {grade.subject_name}: {grade.grade}/100 (weight: {grade.weight})")
        
        if profile.preferences:
            print(f"   - Preferences:")
            print(f"     • Favorite subjects: {profile.preferences.favorite_subjects}")
            print(f"     • Budget range: {profile.preferences.budget_range_min} - {profile.preferences.budget_range_max} MAD")
            print(f"     • Career goals: {profile.preferences.career_goals[:50]}...")
        
        # 3. Get user profiles
        print("\n--- TEST 2: Get User Profiles ---")
        user_profiles = profile_service.get_user_profiles(session, test_user.id)
        print(f"✅ Found {len(user_profiles)} profile(s) for user")
        for p in user_profiles:
            print(f"   - {p.profile_name} ({p.status})")
        
        # 4. Get profile by ID
        print("\n--- TEST 3: Get Profile by ID ---")
        retrieved_profile = profile_service.get_profile_by_id(session, profile.id)
        print(f"✅ Retrieved profile: {retrieved_profile.profile_name}")
        print(f"   - Has academic record: {retrieved_profile.academic_record is not None}")
        print(f"   - Has preferences: {retrieved_profile.preferences is not None}")
        
        # 5. Update profile
        print("\n--- TEST 4: Update Profile ---")
        update_data = ProfileUpdate(
            profile_name="Computer Science - UM6P Track (Updated)",
            draft_payload={
                "wizard_step": 4,
                "completed": True,
                "notes": "Profile completed and ready for recommendations"
            },
            academic_record=None,  # Not updating academic record
            preferences=StudentPreferencesUpdate(
                budget_range_max=200000,  # Increased budget
                career_goals="Become an AI researcher, contribute to cutting-edge technology, and potentially start my own AI startup"
            )
        )
        
        updated_profile = profile_service.update_profile(
            session=session,
            profile=profile,
            profile_data=update_data
        )
        
        print(f"✅ Profile updated: {updated_profile.profile_name}")
        print(f"   - Updated draft payload: {updated_profile.draft_payload}")
        if updated_profile.preferences:
            print(f"   - New budget max: {updated_profile.preferences.budget_range_max}")
            print(f"   - Updated career goals: {updated_profile.preferences.career_goals[:60]}...")
        
        # 6. Change profile status
        print("\n--- TEST 5: Change Profile Status ---")
        activated_profile = profile_service.change_profile_status(
            session=session,
            profile=updated_profile,
            new_status="active"
        )
        print(f"✅ Profile status changed: {activated_profile.status}")
        
        # 7. Create another profile (minimal data)
        print("\n--- TEST 6: Create Minimal Profile ---")
        minimal_profile_data = ProfileCreate(
            profile_name="Medicine Track",
            status="draft"
        )
        
        minimal_profile = profile_service.create_profile(
            session=session,
            user_id=test_user.id,
            profile_data=minimal_profile_data
        )
        
        print(f"✅ Minimal profile created: {minimal_profile.profile_name}")
        print(f"   - Has academic record: {minimal_profile.academic_record is not None}")
        print(f"   - Has preferences: {minimal_profile.preferences is not None}")
        
        # 8. List all profiles again
        print("\n--- TEST 7: List All User Profiles ---")
        all_profiles = profile_service.get_user_profiles(session, test_user.id)
        print(f"✅ User now has {len(all_profiles)} profile(s):")
        for p in all_profiles:
            print(f"   - {p.profile_name} ({p.status})")
        
        # 9. Delete profile
        print("\n--- TEST 8: Delete Profile ---")
        profile_service.delete_profile(session, minimal_profile)
        print(f"✅ Profile '{minimal_profile.profile_name}' deleted")
        
        remaining_profiles = profile_service.get_user_profiles(session, test_user.id)
        print(f"   - Remaining profiles: {len(remaining_profiles)}")
        
        # Cleanup
        print("\n--- Cleanup ---")
        for p in remaining_profiles:
            profile_service.delete_profile(session, p)
        session.delete(test_user)
        session.commit()
        print("✅ Test data cleaned up")
        
    print("\n" + "=" * 70)
    print("✅ ALL PROFILE SERVICE TESTS PASSED!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    try:
        success = test_profile_services()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test FAILED with error:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
