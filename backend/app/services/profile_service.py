"""Profile service layer for business logic."""
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.profile import Profile, AcademicRecord, StudentPreferences
from app.repositories import profile_repository
from app.schemas.profile import (
    ProfileCreate,
    ProfileUpdate,
    AcademicRecordCreate,
    AcademicRecordUpdate,
    StudentPreferencesCreate,
    StudentPreferencesUpdate,
    SubjectGradeCreate,
)


# ============================================================================
# Profile Services
# ============================================================================

def create_profile(
    session: Session,
    user_id: UUID,
    profile_data: ProfileCreate
) -> Profile:
    """
    Create a new profile with optional academic record and preferences.
    
    Args:
        session: Database session
        user_id: Owner user ID
        profile_data: Profile creation data
        
    Returns:
        Created profile with all relationships
    """
    # Create the profile
    profile = profile_repository.create(
        session=session,
        user_id=user_id,
        profile_name=profile_data.profile_name,
        status=profile_data.status,
        draft_payload=profile_data.draft_payload
    )
    
    # Create academic record if provided
    if profile_data.academic_record:
        academic_data = profile_data.academic_record
        subject_grades_data = academic_data.subject_grades or []
        
        # Remove subject_grades from academic_data dict for model creation
        academic_dict = academic_data.model_dump(exclude={"subject_grades"})
        
        academic_record = profile_repository.create_academic_record(
            session=session,
            profile_id=profile.id,
            **academic_dict
        )
        
        # Create subject grades
        for subject_data in subject_grades_data:
            profile_repository.create_subject_grade(
                session=session,
                academic_record_id=academic_record.id,
                **subject_data.model_dump()
            )
    
    # Create preferences if provided
    if profile_data.preferences:
        profile_repository.create_preferences(
            session=session,
            profile_id=profile.id,
            **profile_data.preferences.model_dump()
        )
    
    # Reload profile with all relationships
    return profile_repository.get_by_id(session, profile.id)


def get_user_profiles(session: Session, user_id: UUID) -> list[Profile]:
    """Get all profiles for a user."""
    return profile_repository.get_by_user_id(session, user_id)


def get_profile_by_id(session: Session, profile_id: UUID) -> Optional[Profile]:
    """Get a profile by ID with all relationships."""
    return profile_repository.get_by_id(session, profile_id)


def update_profile(
    session: Session,
    profile: Profile,
    profile_data: ProfileUpdate
) -> Profile:
    """
    Update a profile and its related data.
    
    Args:
        session: Database session
        profile: Existing profile to update
        profile_data: Update data
        
    Returns:
        Updated profile
    """
    # Update profile basic fields
    update_dict = profile_data.model_dump(
        exclude={"academic_record", "preferences"},
        exclude_none=True
    )
    
    if update_dict:
        profile = profile_repository.update(session, profile, **update_dict)
    
    # Update academic record if provided
    if profile_data.academic_record is not None:
        academic_record = profile_repository.get_academic_record_by_profile(
            session, profile.id
        )
        
        academic_dict = profile_data.academic_record.model_dump(exclude_none=True)
        
        if academic_record:
            # Update existing
            profile_repository.update_academic_record(
                session, academic_record, **academic_dict
            )
        else:
            # Create new
            profile_repository.create_academic_record(
                session=session,
                profile_id=profile.id,
                **academic_dict
            )
    
    # Update preferences if provided
    if profile_data.preferences is not None:
        preferences = profile_repository.get_preferences_by_profile(
            session, profile.id
        )
        
        preferences_dict = profile_data.preferences.model_dump(exclude_none=True)
        
        if preferences:
            # Update existing
            profile_repository.update_preferences(
                session, preferences, **preferences_dict
            )
        else:
            # Create new
            profile_repository.create_preferences(
                session=session,
                profile_id=profile.id,
                **preferences_dict
            )
    
    # Reload profile with all relationships
    return profile_repository.get_by_id(session, profile.id)


def delete_profile(session: Session, profile: Profile) -> None:
    """
    Delete a profile and all its related data.
    
    Note: SQLAlchemy cascades will handle related records deletion.
    """
    profile_repository.delete(session, profile)


def change_profile_status(
    session: Session,
    profile: Profile,
    new_status: str
) -> Profile:
    """Change profile status (draft, active, archived)."""
    return profile_repository.change_status(session, profile, new_status)


# ============================================================================
# Academic Record Services
# ============================================================================

def add_subject_grades(
    session: Session,
    academic_record_id: UUID,
    subject_grades: list[SubjectGradeCreate]
) -> AcademicRecord:
    """Add multiple subject grades to an academic record."""
    for subject_data in subject_grades:
        profile_repository.create_subject_grade(
            session=session,
            academic_record_id=academic_record_id,
            **subject_data.model_dump()
        )
    
    # Return updated academic record
    return session.get(AcademicRecord, academic_record_id)


def replace_subject_grades(
    session: Session,
    academic_record_id: UUID,
    subject_grades: list[SubjectGradeCreate]
) -> AcademicRecord:
    """Replace all subject grades for an academic record."""
    # Delete existing grades
    profile_repository.delete_subject_grades(session, academic_record_id)
    
    # Add new grades
    return add_subject_grades(session, academic_record_id, subject_grades)
