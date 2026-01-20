"""Profile-related database models."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TEXT
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.user import User


class Profile(SQLModel, table=True):
    """Student profile metadata with draft payloads."""

    __tablename__ = "profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    user_id: UUID = Field(foreign_key="users.id", nullable=False)
    profile_name: str = Field(nullable=False, max_length=255)
    status: str = Field(default="draft", max_length=50)
    draft_payload: dict | None = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    user: "User" = Relationship(back_populates="profiles")
    academic_record: "AcademicRecord" | None = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"uselist": False},
    )
    preferences: "StudentPreferences" | None = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"uselist": False},
    )


class AcademicRecord(SQLModel, table=True):
    """Academic history for a profile."""

    __tablename__ = "academic_records"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    profile_id: UUID = Field(foreign_key="profiles.id", nullable=False)
    current_status: str | None = Field(default=None, max_length=100)
    current_institution: str | None = Field(default=None, max_length=255)
    current_field: str | None = Field(default=None, max_length=255)
    gpa: float | None = Field(default=None)
    transcript_url: str | None = Field(default=None, max_length=500)
    language_preference: str | None = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    profile: "Profile" = Relationship(back_populates="academic_record")
    subject_grades: list["SubjectGrade"] = Relationship(back_populates="academic_record")


class SubjectGrade(SQLModel, table=True):
    """Subject-level grades for an academic record."""

    __tablename__ = "subject_grades"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    academic_record_id: UUID = Field(foreign_key="academic_records.id", nullable=False)
    subject_name: str | None = Field(default=None, max_length=255)
    grade: float | None = Field(default=None)
    weight: float | None = Field(default=None)

    academic_record: "AcademicRecord" = Relationship(back_populates="subject_grades")


class StudentPreferences(SQLModel, table=True):
    """Preferences and constraints for a profile."""

    __tablename__ = "student_preferences"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    profile_id: UUID = Field(foreign_key="profiles.id", nullable=False)
    favorite_subjects: list[str] | None = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    disliked_subjects: list[str] | None = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    soft_skills: list[str] | None = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    hobbies: list[str] | None = Field(
        default=None,
        sa_column=Column(ARRAY(TEXT)),
    )
    geographic_preference: str | None = Field(default=None, max_length=100)
    budget_range_min: int | None = Field(default=None)
    budget_range_max: int | None = Field(default=None)
    career_goals: str | None = Field(default=None)

    profile: "Profile" = Relationship(back_populates="preferences")
