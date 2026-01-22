"""Database models for the SIRA backend."""
from app.models.user import User
from app.models.profile import AcademicRecord, Profile, StudentPreferences, SubjectGrade
from app.models.document import Document
from app.models.recommendation import Recommendation

__all__ = [
    "User",
    "Profile",
    "AcademicRecord",
    "SubjectGrade",
    "StudentPreferences",
    "Document",
    "Recommendation",
]
