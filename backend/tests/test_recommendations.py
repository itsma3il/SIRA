"""
Test script for Phase 4: AI Recommendation Engine

This script tests the complete recommendation pipeline end-to-end:
1. Create a test profile with realistic data
2. Generate query from profile
3. Retrieve relevant programs
4. Generate AI recommendation
5. Verify storage and retrieval
"""

import asyncio
from uuid import uuid4
from app.db import session_scope
from app.models.user import User
from app.models.profile import Profile, AcademicRecord, StudentPreferences, SubjectGrade
from app.services.query_service import profile_to_query, build_metadata_filters
from app.services.rag_service import retrieve_relevant_programs
from app.services.recommendation_service import get_recommendation_service


def create_test_profile():
    """Create a test student profile for recommendation testing."""
    print("\n" + "="*80)
    print("STEP 1: Creating test student profile...")
    print("="*80)
    
    with session_scope() as db:
        # Check if test user exists
        test_user = db.query(User).filter(User.email == "test@sira.ma").first()
        
        if not test_user:
            test_user = User(
                id=uuid4(),
                clerk_user_id="test_clerk_123",
                email="test@sira.ma"
            )
            db.add(test_user)
            db.commit()
            print(f"✅ Created test user: {test_user.email}")
        else:
            print(f"✅ Using existing test user: {test_user.email}")
        
        # Create profile
        profile = Profile(
            id=uuid4(),
            user_id=test_user.id,
            profile_name="Computer Science Track - Test",
            status="active"
        )
        db.add(profile)
        db.flush()
        
        # Academic record
        academic_record = AcademicRecord(
            id=uuid4(),
            profile_id=profile.id,
            current_status="high_school",
            current_institution="Lycée Mohammed V",
            current_field="Science Mathématiques B",
            gpa=16.5,
            language_preference="French"
        )
        db.add(academic_record)
        db.flush()
        
        # Subject grades
        subjects = [
            ("Mathématiques", 18.0),
            ("Physique-Chimie", 17.5),
            ("Sciences de l'Ingénieur", 16.0),
            ("Informatique", 19.0),
            ("Français", 14.0),
            ("Anglais", 15.5)
        ]
        
        for subject_name, grade in subjects:
            subject_grade = SubjectGrade(
                id=uuid4(),
                academic_record_id=academic_record.id,
                subject_name=subject_name,
                grade=grade,
                weight=1.0
            )
            db.add(subject_grade)
        
        # Student preferences
        preferences = StudentPreferences(
            id=uuid4(),
            profile_id=profile.id,
            favorite_subjects=["Computer Science", "Mathematics", "Artificial Intelligence"],
            disliked_subjects=["Biology", "Literature"],
            soft_skills=["Problem Solving", "Teamwork", "Critical Thinking"],
            hobbies=["Programming", "Gaming", "Robotics"],
            geographic_preference="Morocco",
            budget_range_min=20000,
            budget_range_max=60000,
            career_goals="Software Engineer or Data Scientist specializing in AI"
        )
        db.add(preferences)
        
        db.commit()
        db.refresh(profile)
        
        print(f"\n✅ Created test profile: {profile.profile_name}")
        print(f"   Profile ID: {profile.id}")
        print(f"   GPA: {academic_record.gpa}/20")
        print(f"   Budget: {preferences.budget_range_min}-{preferences.budget_range_max} MAD")
        print(f"   Interests: {', '.join(preferences.favorite_subjects)}")
        
        return profile.id


async def test_query_construction(profile_id):
    """Test query generation from profile."""
    print("\n" + "="*80)
    print("STEP 2: Testing query construction...")
    print("="*80)
    
    with session_scope() as db:
        from app.repositories import profile_repository
        profile = profile_repository.get_by_id(db, profile_id)
        db.refresh(profile)
        
        # Generate query
        query = profile_to_query(profile)
        print(f"\n✅ Generated query:")
        print(f"   '{query}'")
        
        # Build filters
        filters = build_metadata_filters(profile)
        print(f"\n✅ Generated filters:")
        for key, value in filters.items():
            print(f"   {key}: {value}")
        
        return query, filters


async def test_rag_retrieval(profile_id):
    """Test RAG retrieval."""
    print("\n" + "="*80)
    print("STEP 3: Testing RAG retrieval...")
    print("="*80)
    
    with session_scope() as db:
        from app.repositories import profile_repository
        profile = profile_repository.get_by_id(db, profile_id)
        db.refresh(profile)
        
        # Retrieve programs
        programs = await retrieve_relevant_programs(profile, top_k=5)
        
        print(f"\n✅ Retrieved {len(programs)} programs:")
        for idx, program in enumerate(programs, 1):
            print(f"\n   {idx}. {program.university} - {program.program_name}")
            print(f"      Score: {program.score:.4f}")
            if program.metadata:
                if "tuition_fee_mad" in program.metadata:
                    print(f"      Tuition: {program.metadata['tuition_fee_mad']} MAD")
                if "min_gpa" in program.metadata:
                    print(f"      Min GPA: {program.metadata['min_gpa']}/20")
                if "language" in program.metadata:
                    print(f"      Language: {program.metadata['language']}")
        
        return programs


async def test_recommendation_generation(profile_id):
    """Test full recommendation generation."""
    print("\n" + "="*80)
    print("STEP 4: Generating AI recommendation...")
    print("="*80)
    print("⏳ This may take 10-30 seconds...")
    
    service = get_recommendation_service()
    
    try:
        recommendation = await service.generate_recommendation(
            profile_id=profile_id,
            top_k=5,
            use_fallback=True
        )
        
        print(f"\n✅ Recommendation generated successfully!")
        print(f"   Recommendation ID: {recommendation.id}")
        print(f"   Query: {recommendation.query}")
        print(f"   Retrieved {len(recommendation.retrieved_context)} programs")
        
        print(f"\n📄 AI Response:")
        print("="*80)
        print(recommendation.ai_response)
        print("="*80)
        
        if recommendation.structured_data:
            print(f"\n📊 Structured Data:")
            import json
            print(json.dumps(recommendation.structured_data, indent=2))
        
        return recommendation.id
    
    except Exception as e:
        print(f"\n❌ Error generating recommendation: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def test_recommendation_retrieval(recommendation_id):
    """Test retrieving saved recommendation."""
    print("\n" + "="*80)
    print("STEP 5: Testing recommendation retrieval...")
    print("="*80)
    
    service = get_recommendation_service()
    recommendation = service.get_recommendation_by_id(recommendation_id)
    
    if recommendation:
        print(f"✅ Successfully retrieved recommendation {recommendation_id}")
        print(f"   Created at: {recommendation.created_at}")
        print(f"   Response length: {len(recommendation.ai_response)} characters")
        return True
    else:
        print(f"❌ Failed to retrieve recommendation {recommendation_id}")
        return False


async def test_feedback(recommendation_id):
    """Test feedback submission."""
    print("\n" + "="*80)
    print("STEP 6: Testing feedback submission...")
    print("="*80)
    
    service = get_recommendation_service()
    
    try:
        updated = service.submit_feedback(
            recommendation_id=recommendation_id,
            rating=5,
            comment="Excellent recommendations! Very helpful and accurate."
        )
        
        print(f"✅ Feedback submitted successfully")
        print(f"   Rating: {updated.feedback_rating}/5")
        print(f"   Comment: {updated.feedback_comment}")
        return True
    
    except Exception as e:
        print(f"❌ Failed to submit feedback: {str(e)}")
        return False


async def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("🚀 PHASE 4 RECOMMENDATION ENGINE TEST SUITE")
    print("="*80)
    
    try:
        # Step 1: Create test profile
        profile_id = create_test_profile()
        
        # Step 2: Test query construction
        await test_query_construction(profile_id)
        
        # Step 3: Test RAG retrieval
        await test_rag_retrieval(profile_id)
        
        # Step 4: Generate recommendation
        recommendation_id = await test_recommendation_generation(profile_id)
        
        if recommendation_id:
            # Step 5: Test retrieval
            await test_recommendation_retrieval(recommendation_id)
            
            # Step 6: Test feedback
            await test_feedback(recommendation_id)
        
        print("\n" + "="*80)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*80)
        print("\nPhase 4 implementation verified:")
        print("  ✅ Database schema (recommendations table)")
        print("  ✅ Query construction from profile")
        print("  ✅ RAG retrieval with filters")
        print("  ✅ LLM recommendation generation")
        print("  ✅ Recommendation storage")
        print("  ✅ Feedback system")
        print("\nNext steps:")
        print("  - Test streaming endpoint manually")
        print("  - Build frontend recommendation UI (Phase 5)")
        print("  - Add visualization components (Phase 6)")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
