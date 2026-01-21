"""Profile repository for database access."""
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.profile import Profile, AcademicRecord, StudentPreferences, SubjectGrade


# ============================================================================
# Profile Repository
# ============================================================================

def get_by_id(session: Session, profile_id: UUID) -> Optional[Profile]:
    """Get a profile by ID with all relationships loaded."""
    return session.execute(
        select(Profile)
        .options(
            joinedload(Profile.academic_record).joinedload(AcademicRecord.subject_grades),
            joinedload(Profile.preferences)
        )
        .where(Profile.id == profile_id)
    ).unique().scalar_one_or_none()


def get_by_user_id(session: Session, user_id: UUID) -> list[Profile]:
    """Get all profiles for a user."""
    return list(
        session.execute(
            select(Profile)
            .where(Profile.user_id == user_id)
            .order_by(Profile.created_at.desc())
        ).scalars().all()
    )


def create(session: Session, user_id: UUID, profile_name: str, status: str = "draft", 
           draft_payload: Optional[dict] = None) -> Profile:
    """Create a new profile."""
    profile = Profile(
        user_id=user_id,
        profile_name=profile_name,
        status=status,
        draft_payload=draft_payload
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


def update(session: Session, profile: Profile, **kwargs) -> Profile:
    """Update a profile."""
    for key, value in kwargs.items():
        if value is not None and hasattr(profile, key):
            setattr(profile, key, value)
    
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


def delete(session: Session, profile: Profile) -> None:
    """Delete a profile and all related data."""
    session.delete(profile)
    session.commit()


def change_status(session: Session, profile: Profile, new_status: str) -> Profile:
    """Change profile status."""
    profile.status = new_status
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


# ============================================================================
# Academic Record Repository
# ============================================================================

def create_academic_record(
    session: Session,
    profile_id: UUID,
    **kwargs
) -> AcademicRecord:
    """Create an academic record for a profile."""
    academic_record = AcademicRecord(profile_id=profile_id, **kwargs)
    session.add(academic_record)
    session.commit()
    session.refresh(academic_record)
    return academic_record


def get_academic_record_by_profile(
    session: Session,
    profile_id: UUID
) -> Optional[AcademicRecord]:
    """Get academic record for a profile."""
    return session.execute(
        select(AcademicRecord)
        .options(joinedload(AcademicRecord.subject_grades))
        .where(AcademicRecord.profile_id == profile_id)
    ).unique().scalar_one_or_none()


def update_academic_record(
    session: Session,
    academic_record: AcademicRecord,
    **kwargs
) -> AcademicRecord:
    """Update an academic record."""
    for key, value in kwargs.items():
        if value is not None and hasattr(academic_record, key):
            setattr(academic_record, key, value)
    
    session.add(academic_record)
    session.commit()
    session.refresh(academic_record)
    return academic_record


def delete_academic_record(session: Session, academic_record: AcademicRecord) -> None:
    """Delete an academic record."""
    session.delete(academic_record)
    session.commit()


# ============================================================================
# Subject Grade Repository
# ============================================================================

def create_subject_grade(
    session: Session,
    academic_record_id: UUID,
    **kwargs
) -> SubjectGrade:
    """Create a subject grade."""
    subject_grade = SubjectGrade(academic_record_id=academic_record_id, **kwargs)
    session.add(subject_grade)
    session.commit()
    session.refresh(subject_grade)
    return subject_grade


def delete_subject_grades(session: Session, academic_record_id: UUID) -> None:
    """Delete all subject grades for an academic record."""
    subject_grades = session.execute(
        select(SubjectGrade).where(SubjectGrade.academic_record_id == academic_record_id)
    ).scalars().all()
    
    for grade in subject_grades:
        session.delete(grade)
    session.commit()


# ============================================================================
# Student Preferences Repository
# ============================================================================

def create_preferences(
    session: Session,
    profile_id: UUID,
    **kwargs
) -> StudentPreferences:
    """Create student preferences for a profile."""
    preferences = StudentPreferences(profile_id=profile_id, **kwargs)
    session.add(preferences)
    session.commit()
    session.refresh(preferences)
    return preferences


def get_preferences_by_profile(
    session: Session,
    profile_id: UUID
) -> Optional[StudentPreferences]:
    """Get preferences for a profile."""
    return session.execute(
        select(StudentPreferences).where(StudentPreferences.profile_id == profile_id)
    ).scalar_one_or_none()


def update_preferences(
    session: Session,
    preferences: StudentPreferences,
    **kwargs
) -> StudentPreferences:
    """Update student preferences."""
    for key, value in kwargs.items():
        if value is not None and hasattr(preferences, key):
            setattr(preferences, key, value)
    
    session.add(preferences)
    session.commit()
    session.refresh(preferences)
    return preferences


def delete_preferences(session: Session, preferences: StudentPreferences) -> None:
    """Delete student preferences."""
    session.delete(preferences)
    session.commit()
