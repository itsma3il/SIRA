"""Profile-related database models for academic data management."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TEXT, UUID as PostgreSQL_UUID
from sqlalchemy.orm import Mapped, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.user import User


class Profile(Base):
    """
    Student profile with multi-profile support and draft functionality.
    
    Users can create multiple profiles for different academic scenarios
    (e.g., "Computer Science Track", "Medicine Track"). Each profile
    maintains its own academic records and preferences.
    
    Attributes:
        id: Unique identifier (UUID v4)
        user_id: Foreign key to users table
        profile_name: User-defined profile name
        status: Profile status (draft|active|archived)
        draft_payload: JSONB field for storing incomplete profile data
        created_at: Profile creation timestamp (UTC)
        updated_at: Last modification timestamp (UTC)
    """

    __tablename__ = "profiles"

    id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
        doc="Primary key (UUID v4)"
    )
    user_id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
        doc="Owner user ID"
    )
    profile_name: Mapped[str] = Column(
        String(255),
        nullable=False,
        doc="Profile display name"
    )
    status: Mapped[str] = Column(
        String(50),
        default="draft",
        doc="Profile status: draft, active, or archived"
    )
    draft_payload: Mapped[Optional[dict[str, Any]]] = Column(
        JSONB,
        default=None,
        nullable=True,
        doc="Temporary storage for incomplete profile data"
    )
    created_at: Mapped[datetime] = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        doc="Profile creation timestamp (UTC)"
    )
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        doc="Last modification timestamp (UTC)"
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="profiles")
    academic_record: Mapped[Optional["AcademicRecord"]] = relationship(back_populates="profile")
    preferences: Mapped[Optional["StudentPreferences"]] = relationship(back_populates="profile")


class AcademicRecord(Base):
    """
    Academic history and current educational status for a profile.
    
    Stores comprehensive academic information including current status,
    institution details, GPA, and transcripts. Links to detailed
    subject-level grades through SubjectGrade relationship.
    
    Attributes:
        id: Unique identifier (UUID v4)
        profile_id: Foreign key to profiles table
        current_status: Educational status (e.g., "Undergraduate", "High School")
        current_institution: Name of current educational institution
        current_field: Field of study or major
        gpa: Grade point average (0.0-4.0 or equivalent)
        transcript_url: Link to uploaded transcript document
        language_preference: Preferred instruction language
        created_at: Record creation timestamp (UTC)
    """

    __tablename__ = "academic_records"

    id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
        doc="Primary key (UUID v4)"
    )
    profile_id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        ForeignKey("profiles.id"),
        nullable=False,
        unique=True,
        index=True,
        doc="Associated profile ID (one-to-one)"
    )
    current_status: Mapped[Optional[str]] = Column(
        String(100),
        default=None,
        nullable=True,
        doc="Current educational status"
    )
    current_institution: Mapped[Optional[str]] = Column(
        String(255),
        default=None,
        nullable=True,
        doc="Current institution name"
    )
    current_field: Mapped[Optional[str]] = Column(
        String(255),
        default=None,
        nullable=True,
        doc="Current field of study"
    )
    gpa: Mapped[Optional[float]] = Column(
        Float,
        default=None,
        nullable=True,
        doc="Grade point average (0.0-4.0)"
    )
    transcript_url: Mapped[Optional[str]] = Column(
        String(500),
        default=None,
        nullable=True,
        doc="URL to transcript document"
    )
    language_preference: Mapped[Optional[str]] = Column(
        String(50),
        default=None,
        nullable=True,
        doc="Preferred language for instruction"
    )
    created_at: Mapped[datetime] = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        doc="Record creation timestamp (UTC)"
    )

    # Relationships
    profile: Mapped["Profile"] = relationship(back_populates="academic_record")
    subject_grades: Mapped[list["SubjectGrade"]] = relationship(back_populates="academic_record")


class SubjectGrade(Base):
    """
    Individual subject grade for detailed academic performance tracking.
    
    Allows storage of granular subject-level performance data to support
    advanced RAG queries and recommendation accuracy. Each grade can be
    weighted to reflect different credit hours or importance.
    
    Attributes:
        id: Unique identifier (UUID v4)
        academic_record_id: Foreign key to academic_records table
        subject_name: Name of the subject/course
        grade: Numeric grade value
        weight: Subject weight/credit hours (for weighted GPA calculation)
    """

    __tablename__ = "subject_grades"

    id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
        doc="Primary key (UUID v4)"
    )
    academic_record_id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        ForeignKey("academic_records.id"),
        nullable=False,
        index=True,
        doc="Parent academic record ID"
    )
    subject_name: Mapped[Optional[str]] = Column(
        String(255),
        default=None,
        nullable=True,
        doc="Subject/course name"
    )
    grade: Mapped[Optional[float]] = Column(
        Float,
        default=None,
        nullable=True,
        doc="Numeric grade (0-100 scale)"
    )
    weight: Mapped[Optional[float]] = Column(
        Float,
        default=None,
        nullable=True,
        doc="Subject weight/credit hours"
    )

    # Relationships
    academic_record: Mapped["AcademicRecord"] = relationship(back_populates="subject_grades")


class StudentPreferences(Base):
    """
    Student preferences and constraints for personalized recommendations.
    
    Captures student interests, skills, constraints, and aspirations to
    power the RAG-based recommendation engine. Uses PostgreSQL ARRAY
    type for efficient storage of multi-valued attributes.
    
    Attributes:
        id: Unique identifier (UUID v4)
        profile_id: Foreign key to profiles table
        favorite_subjects: List of preferred subjects/fields
        disliked_subjects: List of subjects to avoid
        soft_skills: Student's self-reported soft skills
        hobbies: Personal interests and hobbies
        geographic_preference: Preferred study location/region
        budget_range_min: Minimum budget (annual, in currency units)
        budget_range_max: Maximum budget (annual, in currency units)
        career_goals: Free-text career aspirations
    """

    __tablename__ = "student_preferences"

    id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
        doc="Primary key (UUID v4)"
    )
    profile_id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        ForeignKey("profiles.id"),
        nullable=False,
        unique=True,
        index=True,
        doc="Associated profile ID (one-to-one)"
    )
    favorite_subjects: Mapped[Optional[list[str]]] = Column(
        ARRAY(TEXT),
        default=None,
        nullable=True,
        doc="List of favorite subjects/fields"
    )
    disliked_subjects: Mapped[Optional[list[str]]] = Column(
        ARRAY(TEXT),
        default=None,
        nullable=True,
        doc="List of subjects to avoid"
    )
    soft_skills: Mapped[Optional[list[str]]] = Column(
        ARRAY(TEXT),
        default=None,
        nullable=True,
        doc="Student's soft skills (e.g., leadership, teamwork)"
    )
    hobbies: Mapped[Optional[list[str]]] = Column(
        ARRAY(TEXT),
        default=None,
        nullable=True,
        doc="Personal interests and hobbies"
    )
    geographic_preference: Mapped[Optional[str]] = Column(
        String(100),
        default=None,
        nullable=True,
        doc="Preferred geographic location for study"
    )
    budget_range_min: Mapped[Optional[int]] = Column(
        Integer,
        default=None,
        nullable=True,
        doc="Minimum annual budget (in currency units)"
    )
    budget_range_max: Mapped[Optional[int]] = Column(
        Integer,
        default=None,
        nullable=True,
        doc="Maximum annual budget (in currency units)"
    )
    career_goals: Mapped[Optional[str]] = Column(
        TEXT,
        default=None,
        nullable=True,
        doc="Career aspirations and goals (free text)"
    )

    # Relationships
    profile: Mapped["Profile"] = relationship(back_populates="preferences")
