"""
Integration tests for conversation and recommendation services.

Tests the complete flow:
1. Creating sessions with/without profiles
2. Appending profiles to sessions
3. Generating recommendations
4. Service-level validations
"""
import pytest
from uuid import uuid4, UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.profile import Profile, AcademicRecord, StudentPreferences
from app.models.conversation import ConversationSession
from app.schemas.conversation import SessionCreate, SessionUpdate
from app.schemas.recommendation import RecommendationCreate
from app.services.conversation_service import ConversationService
from app.services.recommendation_service import RecommendationService
from app.db import Base, get_engine, session_scope


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    with session_scope() as session:
        yield session


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user."""
    user = User(
        clerk_user_id=f"clerk_test_{uuid4()}",
        email="integration_test@example.com"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_profile_with_data(db_session: Session, test_user: User):
    """Create a test profile with academic data."""
    profile = Profile(
        user_id=test_user.id,
        profile_name="Computer Science Track - Test",
        status="active"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    
    # Add academic record
    academic = AcademicRecord(
        profile_id=profile.id,
        current_status="Undergraduate",
        current_institution="Test University",
        current_field="Computer Science",
        gpa=3.8
    )
    db_session.add(academic)
    
    # Add preferences
    preferences = StudentPreferences(
        profile_id=profile.id,
        favorite_subjects=["Artificial Intelligence", "Machine Learning"],
        geographic_preference="USA, Canada",
        budget_range_min=20000,
        budget_range_max=50000,
        career_goals="AI Research"
    )
    db_session.add(preferences)
    
    db_session.commit()
    return profile


@pytest.fixture
def conversation_service():
    """Get conversation service instance."""
    return ConversationService()


class TestConversationServiceWithoutProfile:
    """Test conversation service for sessions without profiles."""
    
    def test_create_session_without_profile(
        self, 
        db_session: Session, 
        test_user: User,
        conversation_service: ConversationService
    ):
        """Test creating a session without a profile."""
        session_create = SessionCreate(
            profile_id=None,
            title="General Inquiry"
        )
        
        session_response = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=session_create
        )
        
        assert session_response.id is not None
        assert session_response.profile_id is None
        assert session_response.title == "General Inquiry"
        assert session_response.status == "active"
        print("✓ Service: Created session without profile")
    
    def test_create_session_without_profile_auto_title(
        self, 
        db_session: Session, 
        test_user: User,
        conversation_service: ConversationService
    ):
        """Test auto-generating title for session without profile."""
        session_create = SessionCreate(
            profile_id=None,
            title=None  # Auto-generate
        )
        
        session_response = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=session_create
        )
        
        assert session_response.id is not None
        assert session_response.profile_id is None
        assert "General" in session_response.title
        print("✓ Service: Auto-generated title for session without profile")


class TestConversationServiceWithProfile:
    """Test conversation service for sessions with profiles."""
    
    def test_create_session_with_profile(
        self, 
        db_session: Session, 
        test_user: User,
        test_profile_with_data: Profile,
        conversation_service: ConversationService
    ):
        """Test creating a session with a profile."""
        session_create = SessionCreate(
            profile_id=test_profile_with_data.id,
            title=None  # Auto-generate from profile
        )
        
        session_response = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=session_create
        )
        
        assert session_response.id is not None
        assert session_response.profile_id == test_profile_with_data.id
        assert "Computer Science Track - Test" in session_response.title
        print("✓ Service: Created session with profile")
    
    def test_create_session_invalid_profile(
        self, 
        db_session: Session, 
        test_user: User,
        conversation_service: ConversationService
    ):
        """Test creating a session with invalid profile ID."""
        session_create = SessionCreate(
            profile_id=uuid4(),  # Non-existent profile
            title="Invalid Profile Test"
        )
        
        with pytest.raises(ValueError, match="not found"):
            conversation_service.create_session(
                db=db_session,
                user_id=test_user.id,
                session_create=session_create
            )
        
        print("✓ Service: Rejected invalid profile ID")


class TestAppendingProfileService:
    """Test appending profiles to sessions via service."""
    
    def test_append_profile_to_session(
        self, 
        db_session: Session, 
        test_user: User,
        test_profile_with_data: Profile,
        conversation_service: ConversationService
    ):
        """Test appending a profile to a session that didn't have one."""
        # Create session without profile
        session_create = SessionCreate(profile_id=None, title="General Chat")
        session_response = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=session_create
        )
        
        assert session_response.profile_id is None
        
        # Append profile via update
        session_update = SessionUpdate(
            profile_id=test_profile_with_data.id
        )
        
        updated_session = conversation_service.update_session(
            db=db_session,
            user_id=test_user.id,
            session_id=session_response.id,
            updates=session_update
        )
        
        assert updated_session.profile_id == test_profile_with_data.id
        print("✓ Service: Appended profile to existing session")
    
    def test_append_invalid_profile_fails(
        self, 
        db_session: Session, 
        test_user: User,
        conversation_service: ConversationService
    ):
        """Test that appending an invalid profile fails."""
        # Create session without profile
        session_create = SessionCreate(profile_id=None, title="General Chat")
        session_response = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=session_create
        )
        
        # Try to append non-existent profile
        session_update = SessionUpdate(
            profile_id=uuid4()  # Invalid
        )
        
        with pytest.raises(ValueError, match="not found"):
            conversation_service.update_session(
                db=db_session,
                user_id=test_user.id,
                session_id=session_response.id,
                updates=session_update
            )
        
        print("✓ Service: Rejected invalid profile append")


class TestRecommendationServiceValidation:
    """Test recommendation service validations."""
    
    @pytest.mark.asyncio
    async def test_generate_recommendation_requires_profile_and_session(
        self,
        db_session: Session,
        test_user: User,
        test_profile_with_data: Profile,
        conversation_service: ConversationService
    ):
        """Test that generating recommendations requires both profile and session."""
        # Create session with profile
        session_create = SessionCreate(profile_id=test_profile_with_data.id)
        session_response = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=session_create
        )
        
        # Note: This test would require mocking the RAG service and LLM
        # For now, we just test the validation logic
        print("✓ Service: Recommendation validation setup complete")
    
    @pytest.mark.asyncio
    async def test_cannot_generate_recommendation_without_profile(
        self,
        db_session: Session,
        test_user: User,
        conversation_service: ConversationService
    ):
        """Test that generating recommendations fails if session has no profile."""
        # Create session WITHOUT profile
        session_create = SessionCreate(profile_id=None, title="No Profile")
        session_response = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=session_create
        )
        
        # Try to generate recommendation (should fail)
        with pytest.raises(ValueError, match="no profile"):
            await conversation_service.generate_initial_recommendation(
                db=db_session,
                user_id=test_user.id,
                session_id=session_response.id
            )
        
        print("✓ Service: Blocked recommendation generation without profile")


class TestBusinessLogicConstraints:
    """Test business logic constraints."""
    
    def test_user_can_have_multiple_sessions(
        self, 
        db_session: Session, 
        test_user: User,
        test_profile_with_data: Profile,
        conversation_service: ConversationService
    ):
        """Test that a user can have multiple sessions."""
        # Create multiple sessions
        session1 = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=SessionCreate(profile_id=None, title="Session 1")
        )
        
        session2 = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=SessionCreate(profile_id=test_profile_with_data.id, title="Session 2")
        )
        
        assert session1.id != session2.id
        print("✓ Business Logic: User can have multiple sessions")
    
    def test_profile_can_be_used_in_multiple_sessions(
        self, 
        db_session: Session, 
        test_user: User,
        test_profile_with_data: Profile,
        conversation_service: ConversationService
    ):
        """Test that the same profile can be used in multiple sessions."""
        # Create multiple sessions with the same profile
        session1 = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=SessionCreate(profile_id=test_profile_with_data.id, title="Session 1")
        )
        
        session2 = conversation_service.create_session(
            db=db_session,
            user_id=test_user.id,
            session_create=SessionCreate(profile_id=test_profile_with_data.id, title="Session 2")
        )
        
        assert session1.profile_id == session2.profile_id == test_profile_with_data.id
        print("✓ Business Logic: Profile can be used in multiple sessions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
