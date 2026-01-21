"""Pydantic schemas for API responses and requests."""
from app.schemas.user import UserResponse, UserSyncRequest
from app.schemas.profile import (
    ProfileCreate,
    ProfileUpdate,
    ProfileStatusUpdate,
    ProfileResponse,
    ProfileListResponse,
    AcademicRecordCreate,
    AcademicRecordUpdate,
    AcademicRecordResponse,
    StudentPreferencesCreate,
    StudentPreferencesUpdate,
    StudentPreferencesResponse,
    SubjectGradeCreate,
    SubjectGradeUpdate,
    SubjectGradeResponse,
)

__all__ = [
    "UserSyncRequest",
    "UserResponse",
    "ProfileCreate",
    "ProfileUpdate",
    "ProfileStatusUpdate",
    "ProfileResponse",
    "ProfileListResponse",
    "AcademicRecordCreate",
    "AcademicRecordUpdate",
    "AcademicRecordResponse",
    "StudentPreferencesCreate",
    "StudentPreferencesUpdate",
    "StudentPreferencesResponse",
    "SubjectGradeCreate",
    "SubjectGradeUpdate",
    "SubjectGradeResponse",
]
