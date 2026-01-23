"""
Comprehensive tests for database schema relationships and business logic.

Tests cover:
1. Chat without profile
2. Chat with profile
3. Appending profile to chat
4. Recommendations requiring both profile and session
5. Cascade deletions
6. Constraint validations
"""
import pytest
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.models.profile import Profile
from app.models.conversation import ConversationSession, ConversationMessage
from app.models.recommendation import Recommendation
from app.db import Base, get_engine, session_scope


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    engine = get_engine()
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Use session_scope to get a session
    with session_scope() as session:
        yield session
        
        # Cleanup is handled by the context manager


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user."""
    user = User(
        clerk_user_id=f"clerk_test_{uuid4()}",
        email="test@example.com"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_profile(db_session: Session, test_user: User):
    """Create a test profile."""
    profile = Profile(
        user_id=test_user.id,
        profile_name="Computer Science Track",
        status="active"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


class TestChatWithoutProfile:
    """Test that users can create and use chat sessions without a profile."""
    
    def test_create_session_without_profile(self, db_session: Session, test_user: User):
        """Test creating a chat session without a profile."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=None,  # No profile
            title="General Chat",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)
        
        assert session.id is not None
        assert session.profile_id is None
        assert session.title == "General Chat"
        print("✓ Chat session created without profile")
    
    def test_add_messages_without_profile(self, db_session: Session, test_user: User):
        """Test adding messages to a chat without a profile."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=None,
            title="General Chat",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        # Add user message
        user_msg = ConversationMessage(
            session_id=session.id,
            role="user",
            content="Hello, I'm interested in graduate programs."
        )
        db_session.add(user_msg)
        
        # Add assistant message
        assistant_msg = ConversationMessage(
            session_id=session.id,
            role="assistant",
            content="I'd be happy to help! To provide the best recommendations, please create a profile."
        )
        db_session.add(assistant_msg)
        db_session.commit()
        
        # Verify messages
        messages = db_session.query(ConversationMessage).filter(
            ConversationMessage.session_id == session.id
        ).all()
        
        assert len(messages) == 2
        assert messages[0].role == "user"
        assert messages[1].role == "assistant"
        print("✓ Messages added to chat without profile")


class TestChatWithProfile:
    """Test creating chats with a profile from the start."""
    
    def test_create_session_with_profile(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test creating a chat session with a profile."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="CS Track Consultation",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)
        
        assert session.id is not None
        assert session.profile_id == test_profile.id
        assert session.profile.profile_name == "Computer Science Track"
        print("✓ Chat session created with profile")
    
    def test_one_chat_one_profile_constraint(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test that one chat can only have one profile."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="CS Track",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        # Try to create another profile for the same user
        profile2 = Profile(
            user_id=test_user.id,
            profile_name="Medicine Track",
            status="active"
        )
        db_session.add(profile2)
        db_session.commit()
        
        # Update session to another profile (should work - we allow changing the profile)
        session.profile_id = profile2.id
        db_session.commit()
        db_session.refresh(session)
        
        assert session.profile_id == profile2.id
        assert session.profile.profile_name == "Medicine Track"
        print("✓ Chat can switch between profiles")


class TestAppendingProfile:
    """Test appending a profile to an existing chat."""
    
    def test_append_profile_to_chat(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test appending a profile to a chat that didn't have one."""
        # Create session without profile
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=None,
            title="General Chat",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        # Verify no profile
        assert session.profile_id is None
        
        # Append profile
        session.profile_id = test_profile.id
        db_session.commit()
        db_session.refresh(session)
        
        # Verify profile appended
        assert session.profile_id == test_profile.id
        assert session.profile.profile_name == "Computer Science Track"
        print("✓ Profile appended to existing chat")


class TestRecommendations:
    """Test recommendation constraints and relationships."""
    
    def test_recommendation_requires_profile_and_session(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test that recommendations must have both profile_id and session_id."""
        # Create session with profile
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="CS Track",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        # Create recommendation with both profile and session
        recommendation = Recommendation(
            profile_id=test_profile.id,
            session_id=session.id,
            query="Computer Science graduate programs",
            ai_response="Here are some recommendations...",
            structured_data={"programs": ["MIT", "Stanford"]}
        )
        db_session.add(recommendation)
        db_session.commit()
        db_session.refresh(recommendation)
        
        assert recommendation.profile_id == test_profile.id
        assert recommendation.session_id == session.id
        print("✓ Recommendation created with profile and session")
    
    def test_recommendation_without_session_fails(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test that creating a recommendation without session_id fails."""
        # Try to create recommendation without session_id (should fail due to NOT NULL constraint)
        recommendation = Recommendation(
            profile_id=test_profile.id,
            session_id=None,  # This should fail
            query="Computer Science graduate programs",
            ai_response="Here are some recommendations..."
        )
        db_session.add(recommendation)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        print("✓ Recommendation without session_id fails (as expected)")
    
    def test_one_profile_multiple_recommendations(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test that one profile can have multiple recommendations."""
        # Create multiple sessions
        session1 = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="Session 1",
            status="active"
        )
        session2 = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="Session 2",
            status="active"
        )
        db_session.add_all([session1, session2])
        db_session.commit()
        
        # Create multiple recommendations for the same profile
        rec1 = Recommendation(
            profile_id=test_profile.id,
            session_id=session1.id,
            query="Query 1",
            ai_response="Response 1"
        )
        rec2 = Recommendation(
            profile_id=test_profile.id,
            session_id=session2.id,
            query="Query 2",
            ai_response="Response 2"
        )
        db_session.add_all([rec1, rec2])
        db_session.commit()
        
        # Verify both recommendations exist
        recommendations = db_session.query(Recommendation).filter(
            Recommendation.profile_id == test_profile.id
        ).all()
        
        assert len(recommendations) == 2
        print("✓ One profile can have multiple recommendations")
    
    def test_one_session_multiple_recommendations(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test that one session can have multiple recommendations."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="Session",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        # Create multiple recommendations for the same session
        rec1 = Recommendation(
            profile_id=test_profile.id,
            session_id=session.id,
            query="Query 1",
            ai_response="Response 1"
        )
        rec2 = Recommendation(
            profile_id=test_profile.id,
            session_id=session.id,
            query="Query 2",
            ai_response="Response 2"
        )
        db_session.add_all([rec1, rec2])
        db_session.commit()
        
        # Verify both recommendations exist
        recommendations = db_session.query(Recommendation).filter(
            Recommendation.session_id == session.id
        ).all()
        
        assert len(recommendations) == 2
        print("✓ One session can have multiple recommendations")


class TestCascadeDeletions:
    """Test cascade deletion behavior."""
    
    def test_delete_session_deletes_messages(self, db_session: Session, test_user: User):
        """Test that deleting a session deletes its messages."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=None,
            title="Test Session",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        # Add messages
        msg = ConversationMessage(
            session_id=session.id,
            role="user",
            content="Test message"
        )
        db_session.add(msg)
        db_session.commit()
        
        session_id = session.id
        
        # Delete session
        db_session.delete(session)
        db_session.commit()
        
        # Verify messages are deleted (CASCADE)
        messages = db_session.query(ConversationMessage).filter(
            ConversationMessage.session_id == session_id
        ).all()
        
        assert len(messages) == 0
        print("✓ Deleting session cascades to messages")
    
    def test_delete_session_deletes_recommendations(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test that deleting a session deletes its recommendations."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="Test Session",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        # Add recommendation
        rec = Recommendation(
            profile_id=test_profile.id,
            session_id=session.id,
            query="Test query",
            ai_response="Test response"
        )
        db_session.add(rec)
        db_session.commit()
        
        session_id = session.id
        
        # Delete session
        db_session.delete(session)
        db_session.commit()
        
        # Verify recommendations are deleted (CASCADE)
        recommendations = db_session.query(Recommendation).filter(
            Recommendation.session_id == session_id
        ).all()
        
        assert len(recommendations) == 0
        print("✓ Deleting session cascades to recommendations")
    
    def test_delete_profile_sets_session_profile_null(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test that deleting a profile sets session.profile_id to NULL (SET NULL behavior)."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="Test Session",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        session_id = session.id
        
        # Delete profile
        db_session.delete(test_profile)
        db_session.commit()
        
        # Expire all objects to force reload from database
        db_session.expire_all()
        
        # Verify session still exists but profile_id is NULL
        session = db_session.query(ConversationSession).filter(
            ConversationSession.id == session_id
        ).first()
        
        assert session is not None, "Session should still exist after profile deletion"
        assert session.profile_id is None, "Session profile_id should be NULL after profile deletion"
        print("✓ Deleting profile sets session.profile_id to NULL")
    
    def test_delete_profile_deletes_recommendations(self, db_session: Session, test_user: User, test_profile: Profile):
        """Test that deleting a profile cascades to its recommendations."""
        session = ConversationSession(
            user_id=test_user.id,
            profile_id=test_profile.id,
            title="Test Session",
            status="active"
        )
        db_session.add(session)
        db_session.commit()
        
        # Add recommendation
        rec = Recommendation(
            profile_id=test_profile.id,
            session_id=session.id,
            query="Test query",
            ai_response="Test response"
        )
        db_session.add(rec)
        db_session.commit()
        
        profile_id = test_profile.id
        
        # Delete profile
        db_session.delete(test_profile)
        db_session.commit()
        
        # Verify recommendations are deleted (CASCADE)
        recommendations = db_session.query(Recommendation).filter(
            Recommendation.profile_id == profile_id
        ).all()
        
        assert len(recommendations) == 0
        print("✓ Deleting profile cascades to recommendations")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
