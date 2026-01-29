"""Unit tests for Pydantic schema validation."""
import pytest
from pydantic import ValidationError

from app.schemas.profile import (
    SubjectGradeCreate,
    AcademicRecordCreate,
    StudentPreferencesCreate,
    ProfileCreate,
)


class TestSubjectGradeValidation:
    """Tests for SubjectGradeCreate schema validation."""

    def test_valid_subject_grade(self):
        """Test valid subject grade creation."""
        grade = SubjectGradeCreate(
            subject_name="Mathematics",
            grade=85.5,
            weight=4.0
        )
        assert grade.subject_name == "Mathematics"
        assert grade.grade == 85.5
        assert grade.weight == 4.0

    def test_sanitize_subject_name(self):
        """Test subject name is sanitized."""
        grade = SubjectGradeCreate(
            subject_name="  Math  ",
            grade=90.0
        )
        assert grade.subject_name == "Math"

    def test_invalid_grade_range(self):
        """Test grade outside valid range raises error."""
        with pytest.raises(ValidationError):
            SubjectGradeCreate(subject_name="Math", grade=101.0)
        
        with pytest.raises(ValidationError):
            SubjectGradeCreate(subject_name="Math", grade=-5.0)

    def test_negative_weight_rejected(self):
        """Test negative weight is rejected."""
        with pytest.raises(ValidationError):
            SubjectGradeCreate(
                subject_name="Math",
                grade=80.0,
                weight=-1.0
            )

    def test_empty_subject_name_rejected(self):
        """Test empty subject name is rejected."""
        with pytest.raises(ValidationError):
            SubjectGradeCreate(subject_name="", grade=80.0)


class TestAcademicRecordValidation:
    """Tests for AcademicRecordCreate schema validation."""

    def test_valid_academic_record(self):
        """Test valid academic record creation."""
        record = AcademicRecordCreate(
            current_status="High School",
            current_institution="Test School",
            gpa=15.5,
            language_preference="English"
        )
        assert record.current_status == "High School"
        assert record.gpa == 15.5

    def test_sanitize_text_fields(self):
        """Test text fields are sanitized."""
        record = AcademicRecordCreate(
            current_status="  Student  ",
            current_institution="  Test School  "
        )
        assert record.current_status == "Student"
        assert record.current_institution == "Test School"

    def test_invalid_gpa_range(self):
        """Test GPA outside valid range raises error."""
        with pytest.raises(ValidationError):
            AcademicRecordCreate(gpa=25.0)
        
        with pytest.raises(ValidationError):
            AcademicRecordCreate(gpa=-1.0)

    def test_valid_transcript_url(self):
        """Test valid transcript URL is accepted."""
        record = AcademicRecordCreate(
            transcript_url="https://example.com/transcript.pdf"
        )
        assert record.transcript_url == "https://example.com/transcript.pdf"

    def test_invalid_transcript_url(self):
        """Test invalid transcript URL is rejected."""
        with pytest.raises(ValidationError):
            AcademicRecordCreate(
                transcript_url="javascript:alert('xss')"
            )

    def test_subject_grades_validation(self):
        """Test nested subject grades are validated."""
        record = AcademicRecordCreate(
            subject_grades=[
                SubjectGradeCreate(subject_name="Math", grade=85.0)
            ]
        )
        assert len(record.subject_grades) == 1


class TestStudentPreferencesValidation:
    """Tests for StudentPreferencesCreate schema validation."""

    def test_valid_preferences(self):
        """Test valid student preferences creation."""
        prefs = StudentPreferencesCreate(
            favorite_subjects=["Math", "Physics"],
            geographic_preference="Europe",
            budget_range_min=5000,
            budget_range_max=15000
        )
        assert len(prefs.favorite_subjects) == 2
        assert prefs.budget_range_min == 5000

    def test_sanitize_list_fields(self):
        """Test list fields are sanitized and deduplicated."""
        prefs = StudentPreferencesCreate(
            favorite_subjects=["  Math  ", "Physics", "Math", ""],
            soft_skills=["", "  Leadership  ", "Teamwork"]
        )
        # Should remove empty strings, duplicates, and trim whitespace
        assert "Math" in prefs.favorite_subjects
        assert prefs.favorite_subjects.count("Math") == 1
        assert "" not in prefs.favorite_subjects
        assert "Leadership" in prefs.soft_skills

    def test_sanitize_career_goals(self):
        """Test career goals HTML is sanitized."""
        prefs = StudentPreferencesCreate(
            career_goals="<p>Software Engineer</p><script>alert('xss')</script>"
        )
        assert "<script>" not in prefs.career_goals
        assert "Software Engineer" in prefs.career_goals

    def test_budget_range_validation(self):
        """Test budget range min <= max validation."""
        # Valid range
        prefs = StudentPreferencesCreate(
            budget_range_min=5000,
            budget_range_max=15000
        )
        assert prefs.budget_range_min < prefs.budget_range_max

        # Invalid range
        with pytest.raises(ValidationError, match="budget_range_min must be less than"):
            StudentPreferencesCreate(
                budget_range_min=20000,
                budget_range_max=10000
            )

    def test_negative_budget_rejected(self):
        """Test negative budget values are rejected."""
        with pytest.raises(ValidationError):
            StudentPreferencesCreate(budget_range_min=-1000)


class TestProfileValidation:
    """Tests for ProfileCreate schema validation."""

    def test_valid_profile(self):
        """Test valid profile creation."""
        profile = ProfileCreate(
            profile_name="CS Track",
            status="draft"
        )
        assert profile.profile_name == "CS Track"
        assert profile.status == "draft"

    def test_sanitize_profile_name(self):
        """Test profile name is sanitized."""
        profile = ProfileCreate(
            profile_name="  My Profile  "
        )
        assert profile.profile_name == "My Profile"

    def test_empty_profile_name_rejected(self):
        """Test empty profile name is rejected."""
        with pytest.raises(ValidationError):
            ProfileCreate(profile_name="")
        
        with pytest.raises(ValidationError):
            ProfileCreate(profile_name="   ")

    def test_status_validation(self):
        """Test only allowed status values are accepted."""
        # Valid statuses
        for status in ["draft", "active", "archived"]:
            profile = ProfileCreate(
                profile_name="Test",
                status=status
            )
            assert profile.status == status

        # Invalid status
        with pytest.raises(ValidationError, match="Status must be one of"):
            ProfileCreate(
                profile_name="Test",
                status="invalid_status"
            )

    def test_nested_validation(self):
        """Test nested academic record and preferences are validated."""
        profile = ProfileCreate(
            profile_name="Test Profile",
            academic_record=AcademicRecordCreate(
                gpa=15.5,
                subject_grades=[
                    SubjectGradeCreate(subject_name="Math", grade=85.0)
                ]
            ),
            preferences=StudentPreferencesCreate(
                favorite_subjects=["Math"],
                budget_range_min=5000,
                budget_range_max=10000
            )
        )
        assert profile.academic_record.gpa == 15.5
        assert profile.preferences.budget_range_min == 5000
