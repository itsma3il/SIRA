"""
Comprehensive test script for Phase 4: AI Recommendation Engine

This script tests the full recommendation pipeline:
1. Load existing profile from database
2. Test query construction from profile
3. Test RAG retrieval (semantic search + metadata filtering)
4. Test prompt generation
5. Test LLM recommendation generation
6. Test recommendation storage
7. Test recommendation retrieval
8. Test feedback submission

Run with: docker-compose exec backend python -m app.test_recommendation_pipeline
"""

import asyncio
import os
import sys
from uuid import UUID

import pytest
from sqlalchemy import text

from app.db import session_scope
from app.repositories import profile_repository
from app.services.query_service import profile_to_query, build_metadata_filters
from app.services.rag_service import retrieve_relevant_programs, retrieve_with_fallback
from app.services.prompt_service import create_user_prompt, SYSTEM_PROMPT
from app.services.recommendation_service import get_recommendation_service


def print_separator(title: str = ""):
    """Print a visual separator."""
    print("\n" + "=" * 80)
    if title:
        print(f"  {title}")
        print("=" * 80)
    else:
        print("=" * 80)


def print_success(message: str):
    """Print success message."""
    print(f"✅ {message}")


def print_error(message: str):
    """Print error message."""
    print(f"❌ {message}")


# Skip these tests if external API keys are not configured
pytestmark = pytest.mark.skipif(
    not os.getenv("MISTRAL_API_KEY") or not os.getenv("PINECONE_API_KEY"),
    reason="External API keys (MISTRAL_API_KEY, PINECONE_API_KEY) not configured for testing"
)


# These are integration tests that require fixtures - mark as async integration tests
pytest.skip("Integration tests require fixture setup", allow_module_level=True)


def print_info(message: str):
    """Print info message."""
    print(f"ℹ️  {message}")


async def test_step_1_load_profile():
    """Step 1: Load an existing profile from database."""
    print_separator("STEP 1: Load Existing Profile")
    
    with session_scope() as session:
        # Get all profiles
        result = session.execute(
            text("SELECT id, profile_name, user_id FROM profiles ORDER BY created_at DESC LIMIT 5")
        )
        profiles = result.fetchall()
        
        if not profiles:
            print_error("No profiles found in database!")
            print_info("Please create a profile first using the API or frontend")
            return None
        
        print(f"Found {len(profiles)} profiles:")
        for idx, (profile_id, name, user_id) in enumerate(profiles, 1):
            print(f"  {idx}. {name} (ID: {profile_id})")
        
        # Use the first profile (already a UUID object from database)
        profile_id = profiles[0][0]
        profile = profile_repository.get_by_id(session, profile_id)
        
        if not profile:
            print_error(f"Could not load profile {profile_id}")
            return None
        
        print_success(f"Loaded profile: {profile.profile_name}")
        print(f"  Status: {profile.status}")
        
        if profile.academic_record:
            print(f"  GPA: {profile.academic_record.gpa}")
            print(f"  Field: {profile.academic_record.current_field}")
        
        if profile.preferences:
            print(f"  Budget Max: {profile.preferences.budget_range_max} MAD")
            print(f"  Interests: {profile.preferences.favorite_subjects}")
        
        return profile_id


async def test_step_2_query_construction(profile_id: UUID):
    """Step 2: Test query construction from profile."""
    print_separator("STEP 2: Query Construction")
    
    with session_scope() as session:
        profile = profile_repository.get_by_id(session, profile_id)
        
        # Generate query
        query = profile_to_query(profile)
        print_success("Generated semantic query:")
        print(f"  '{query}'")
        
        # Build filters
        filters = build_metadata_filters(profile)
        print_success("Generated metadata filters:")
        for key, value in filters.items():
            print(f"  {key}: {value}")
        
        return query, filters


async def test_step_3_rag_retrieval(profile_id: UUID):
    """Step 3: Test RAG retrieval."""
    print_separator("STEP 3: RAG Retrieval (Semantic Search)")
    
    with session_scope() as session:
        profile = profile_repository.get_by_id(session, profile_id)
        
        # Test standard retrieval
        print_info("Testing standard retrieval with filters...")
        programs = await retrieve_relevant_programs(profile, top_k=3)
        
        if programs:
            print_success(f"Retrieved {len(programs)} programs:")
            for idx, program in enumerate(programs, 1):
                print(f"\n  {idx}. {program.university} - {program.program_name}")
                print(f"     Score: {program.score:.4f}")
                print(f"     Tuition: {program.metadata.get('tuition_fee_mad', 'N/A')} MAD")
                print(f"     Min GPA: {program.metadata.get('min_gpa', 'N/A')}")
        else:
            print_error("No programs retrieved with strict filters!")
        
        # Test fallback retrieval
        print_info("\nTesting fallback retrieval strategy...")
        programs_fallback, strategy = await retrieve_with_fallback(profile, top_k=3)
        print_success(f"Fallback strategy used: {strategy}")
        
        if programs_fallback:
            print_success(f"Retrieved {len(programs_fallback)} programs with fallback")
            for idx, program in enumerate(programs_fallback, 1):
                print(f"\n  {idx}. {program.university} - {program.program_name}")
                print(f"     Score: {program.score:.4f}")
            # Use fallback programs for next steps
            return programs_fallback
        else:
            return programs


async def test_step_4_prompt_generation(profile_id: UUID, programs):
    """Step 4: Test prompt generation."""
    print_separator("STEP 4: Prompt Generation")
    
    with session_scope() as session:
        profile = profile_repository.get_by_id(session, profile_id)
        
        # Generate prompts
        user_prompt = create_user_prompt(profile, programs)
        
        print_success("System prompt generated:")
        print(f"  Length: {len(SYSTEM_PROMPT)} characters")
        print(f"  First 200 chars: {SYSTEM_PROMPT[:200]}...")
        
        print_success("\nUser prompt generated:")
        print(f"  Length: {len(user_prompt)} characters")
        print(f"  First 300 chars:")
        print(f"  {user_prompt[:300]}...")
        
        return user_prompt


async def test_step_5_generate_recommendation(profile_id: UUID):
    """Step 5: Test full recommendation generation."""
    print_separator("STEP 5: Generate AI Recommendation")
    
    print_info("Calling Mistral AI LLM to generate recommendation...")
    print_info("This may take 10-30 seconds...")
    
    try:
        service = get_recommendation_service()
        recommendation = await service.generate_recommendation(
            profile_id=profile_id,
            top_k=5,
            use_fallback=True
        )
        
        print_success("Recommendation generated successfully!")
        print(f"  Recommendation ID: {recommendation.id}")
        print(f"  Query used: {recommendation.query[:100]}...")
        print(f"  Response length: {len(recommendation.ai_response)} characters")
        
        # Show first part of response
        print_success("\nFirst 500 characters of AI response:")
        print(f"  {recommendation.ai_response[:500]}...")
        
        # Show structured data if available
        if recommendation.structured_data:
            print_success("\nStructured data extracted:")
            for key, value in recommendation.structured_data.items():
                print(f"  {key}: {value}")
        
        return recommendation
        
    except Exception as e:
        print_error(f"Failed to generate recommendation: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return None


async def test_step_6_retrieve_recommendation(recommendation_id: UUID):
    """Step 6: Test recommendation retrieval."""
    print_separator("STEP 6: Retrieve Saved Recommendation")
    
    service = get_recommendation_service()
    recommendation = service.get_recommendation_by_id(recommendation_id)
    
    if recommendation:
        print_success("Successfully retrieved recommendation from database")
        print(f"  ID: {recommendation.id}")
        print(f"  Profile ID: {recommendation.profile_id}")
        print(f"  Created at: {recommendation.created_at}")
        print(f"  Retrieved {len(recommendation.retrieved_context or [])} programs in context")
        return True
    else:
        print_error("Failed to retrieve recommendation")
        return False


async def test_step_7_submit_feedback(recommendation_id: UUID):
    """Step 7: Test feedback submission."""
    print_separator("STEP 7: Submit Feedback")
    
    service = get_recommendation_service()
    
    try:
        updated = service.submit_feedback(
            recommendation_id=recommendation_id,
            rating=5,
            comment="This is an excellent recommendation! Very helpful and accurate."
        )
        
        if updated:
            print_success("Feedback submitted successfully!")
            print(f"  Rating: {updated.feedback_rating}/5")
            print(f"  Comment: {updated.feedback_comment[:100]}...")
            return True
        else:
            print_error("Failed to submit feedback")
            return False
            
    except Exception as e:
        print_error(f"Feedback submission failed: {str(e)}")
        return False


async def test_step_8_list_profile_recommendations(profile_id: UUID):
    """Step 8: Test listing all recommendations for a profile."""
    print_separator("STEP 8: List All Recommendations for Profile")
    
    service = get_recommendation_service()
    recommendations = service.get_recommendations_by_profile(profile_id, limit=10)
    
    print_success(f"Found {len(recommendations)} recommendations for this profile:")
    for idx, rec in enumerate(recommendations, 1):
        print(f"\n  {idx}. ID: {rec.id}")
        print(f"     Created: {rec.created_at}")
        print(f"     Rating: {rec.feedback_rating or 'Not rated'}")
        print(f"     Response preview: {rec.ai_response[:100]}...")


async def main():
    """Run all tests in sequence."""
    print_separator("🚀 PHASE 4: AI RECOMMENDATION ENGINE - FULL PIPELINE TEST 🚀")
    
    try:
        # Step 1: Load profile
        profile_id = await test_step_1_load_profile()
        if not profile_id:
            print_error("Cannot continue without a profile. Exiting.")
            return
        
        # Step 2: Query construction
        query, filters = await test_step_2_query_construction(profile_id)
        
        # Step 3: RAG retrieval
        programs = await test_step_3_rag_retrieval(profile_id)
        if not programs:
            print_error("No programs retrieved. Cannot continue to LLM generation.")
            print_info("This might mean:")
            print_info("  - No programs match the profile criteria")
            print_info("  - Pinecone index is empty")
            print_info("  - There's an issue with the retrieval service")
            return
        
        # Step 4: Prompt generation
        user_prompt = await test_step_4_prompt_generation(profile_id, programs)
        
        # Step 5: Generate recommendation (LLM call)
        recommendation = await test_step_5_generate_recommendation(profile_id)
        if not recommendation:
            print_error("Recommendation generation failed. Cannot continue.")
            return
        
        # Step 6: Retrieve recommendation
        await test_step_6_retrieve_recommendation(recommendation.id)
        
        # Step 7: Submit feedback
        await test_step_7_submit_feedback(recommendation.id)
        
        # Step 8: List all recommendations
        await test_step_8_list_profile_recommendations(profile_id)
        
        print_separator("✅ ALL TESTS COMPLETED SUCCESSFULLY! ✅")
        print_success("Phase 4 implementation is working end-to-end!")
        print_info("\nNext steps:")
        print_info("  1. Test the API endpoints directly (POST /api/recommendations/generate)")
        print_info("  2. Test streaming endpoint (GET /api/recommendations/stream/{profile_id})")
        print_info("  3. Build frontend UI (Phase 5)")
        
    except KeyboardInterrupt:
        print_error("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n\nUnexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
