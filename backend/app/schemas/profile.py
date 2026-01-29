"""Profile-related Pydantic schemas for API requests and responses."""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.utils.validation import (
    sanitize_string,
    sanitize_html,
    validate_url,
    validate_gpa,
    validate_grade,
)


# ============================================================================
# Subject Grade Schemas
# ============================================================================

class SubjectGradeCreate(BaseModel):
    """Schema for creating a subject grade."""
    subject_name: str = Field(..., max_length=255, description="Subject/course name")
    grade: float = Field(..., ge=0.0, le=100.0, description="Numeric grade (0-100 scale)")
    weight: Optional[float] = Field(None, ge=0.0, description="Subject weight/credit hours")

    @field_validator("subject_name")
    @classmethod
    def sanitize_subject_name(cls, v: str) -> str:
        """Sanitize subject name."""
        sanitized = sanitize_string(v, max_length=255)
        if not sanitized:
            raise ValueError("Subject name cannot be empty")
        return sanitized

    @field_validator("grade")
    @classmethod
    def validate_grade_value(cls, v: float) -> float:
        """Validate grade is in acceptable range."""
        return validate_grade(v, min_value=0.0, max_value=100.0) or 0.0

    @field_validator("weight")
    @classmethod
    def validate_weight_value(cls, v: Optional[float]) -> Optional[float]:
        """Validate weight is non-negative."""
        if v is not None and v < 0:
            raise ValueError("Weight cannot be negative")
        return v


class SubjectGradeUpdate(BaseModel):
    """Schema for updating a subject grade."""
    subject_name: Optional[str] = Field(None, max_length=255)
    grade: Optional[float] = Field(None, ge=0.0, le=100.0)
    weight: Optional[float] = Field(None, ge=0.0)


class SubjectGradeResponse(BaseModel):
    """Schema for subject grade response."""
    id: UUID
    academic_record_id: UUID
    subject_name: Optional[str] = None
    grade: Optional[float] = None
    weight: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Academic Record Schemas
# ============================================================================

class AcademicRecordCreate(BaseModel):
    """Schema for creating an academic record."""
    current_status: Optional[str] = Field(None, max_length=100, description="Educational status")
    current_institution: Optional[str] = Field(None, max_length=255, description="Institution name")
    current_field: Optional[str] = Field(None, max_length=255, description="Field of study")
    gpa: Optional[float] = Field(None, ge=0.0, le=20.0, description="GPA (0-20 scale)")
    transcript_url: Optional[str] = Field(None, max_length=500, description="Transcript URL")
    language_preference: Optional[str] = Field(None, max_length=50, description="Language preference")
    subject_grades: Optional[list[SubjectGradeCreate]] = Field(default_factory=list)

    @field_validator("current_status", "current_institution", "current_field", "language_preference")
    @classmethod
    def sanitize_text_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize text fields."""
        return sanitize_string(v, max_length=255)

    @field_validator("gpa")
    @classmethod
    def validate_gpa_value(cls, v: Optional[float]) -> Optional[float]:
        """Validate GPA is in acceptable range."""
        return validate_gpa(v, min_value=0.0, max_value=20.0)

    @field_validator("transcript_url")
    @classmethod
    def validate_transcript_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate transcript URL format."""
        if v is None:
            return None
        try:
            return validate_url(v)
        except ValueError as e:
            raise ValueError(f"Invalid transcript URL: {str(e)}")


class AcademicRecordUpdate(BaseModel):
    """Schema for updating an academic record."""
    current_status: Optional[str] = Field(None, max_length=100)
    current_institution: Optional[str] = Field(None, max_length=255)
    current_field: Optional[str] = Field(None, max_length=255)
    gpa: Optional[float] = Field(None, ge=0.0, le=20.0)
    transcript_url: Optional[str] = Field(None, max_length=500)
    language_preference: Optional[str] = Field(None, max_length=50)


class AcademicRecordResponse(BaseModel):
    """Schema for academic record response."""
    id: UUID
    profile_id: UUID
    current_status: Optional[str] = None
    current_institution: Optional[str] = None
    current_field: Optional[str] = None
    gpa: Optional[float] = None
    transcript_url: Optional[str] = None
    language_preference: Optional[str] = None
    created_at: datetime
    subject_grades: list[SubjectGradeResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Student Preferences Schemas
# ============================================================================

class StudentPreferencesCreate(BaseModel):
    """Schema for creating student preferences."""
    favorite_subjects: Optional[list[str]] = Field(default_factory=list)
    disliked_subjects: Optional[list[str]] = Field(default_factory=list)
    soft_skills: Optional[list[str]] = Field(default_factory=list)
    hobbies: Optional[list[str]] = Field(default_factory=list)
    geographic_preference: Optional[str] = Field(None, max_length=100)
    budget_range_min: Optional[int] = Field(None, ge=0, description="Minimum annual budget")
    budget_range_max: Optional[int] = Field(None, ge=0, description="Maximum annual budget")
    career_goals: Optional[str] = None

    @field_validator("favorite_subjects", "disliked_subjects", "soft_skills", "hobbies")
    @classmethod
    def sanitize_list_fields(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        """Sanitize list of strings, remove empty and duplicate values."""
        if v is None:
            return None
        # Sanitize each string and filter out empty values
        sanitized = [sanitize_string(item, max_length=100) for item in v if item]
        # Remove None values and duplicates while preserving order
        seen = set()
        result = []
        for item in sanitized:
            if item and item not in seen:
                seen.add(item)
                result.append(item)
        return result if result else None

    @field_validator("geographic_preference")
    @classmethod
    def sanitize_geographic_preference(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize geographic preference."""
        return sanitize_string(v, max_length=100)

    @field_validator("career_goals")
    @classmethod
    def sanitize_career_goals(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize career goals text."""
        return sanitize_html(v)

    @model_validator(mode="after")
    def validate_budget_range(self) -> "StudentPreferencesCreate":
        """Validate budget range min is less than max."""
        if (
            self.budget_range_min is not None
            and self.budget_range_max is not None
            and self.budget_range_min > self.budget_range_max
        ):
            raise ValueError("budget_range_min must be less than or equal to budget_range_max")
        return self


class StudentPreferencesUpdate(BaseModel):
    """Schema for updating student preferences."""
    favorite_subjects: Optional[list[str]] = None
    disliked_subjects: Optional[list[str]] = None
    soft_skills: Optional[list[str]] = None
    hobbies: Optional[list[str]] = None
    geographic_preference: Optional[str] = Field(None, max_length=100)
    budget_range_min: Optional[int] = Field(None, ge=0)
    budget_range_max: Optional[int] = Field(None, ge=0)
    career_goals: Optional[str] = None


class StudentPreferencesResponse(BaseModel):
    """Schema for student preferences response."""
    id: UUID
    profile_id: UUID
    favorite_subjects: Optional[list[str]] = None
    disliked_subjects: Optional[list[str]] = None
    soft_skills: Optional[list[str]] = None
    hobbies: Optional[list[str]] = None
    geographic_preference: Optional[str] = None
    budget_range_min: Optional[int] = None
    budget_range_max: Optional[int] = None
    career_goals: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Profile Schemas
# ============================================================================

class ProfileCreate(BaseModel):
    """Schema for creating a new profile."""
    profile_name: str = Field(..., min_length=1, max_length=255, description="Profile display name")
    status: str = Field(default="draft", max_length=50, description="Profile status")
    draft_payload: Optional[dict[str, Any]] = Field(None, description="Draft data storage")
    academic_record: Optional[AcademicRecordCreate] = None
    preferences: Optional[StudentPreferencesCreate] = None

    @field_validator("profile_name")
    @classmethod
    def sanitize_profile_name(cls, v: str) -> str:
        """Sanitize profile name."""
        sanitized = sanitize_string(v, max_length=255)
        if not sanitized:
            raise ValueError("Profile name cannot be empty")
        return sanitized

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Validate status is one of allowed values."""
        allowed_statuses = ["draft", "active", "archived"]
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of: {', '.join(allowed_statuses)}")
        return v


class ProfileUpdate(BaseModel):
    """Schema for updating a profile."""
    profile_name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = Field(None, max_length=50)
    draft_payload: Optional[dict[str, Any]] = None
    academic_record: Optional[AcademicRecordUpdate] = None
    preferences: Optional[StudentPreferencesUpdate] = None


class ProfileStatusUpdate(BaseModel):
    """Schema for updating only the profile status."""
    status: str = Field(..., max_length=50, description="New status: draft, active, or archived")


class ProfileResponse(BaseModel):
    """Schema for profile response."""
    id: UUID
    user_id: UUID
    profile_name: str
    status: str
    draft_payload: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    academic_record: Optional[AcademicRecordResponse] = None
    preferences: Optional[StudentPreferencesResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileListResponse(BaseModel):
    """Schema for listing profiles (without nested data for performance)."""
    id: UUID
    user_id: UUID
    profile_name: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
