"""Unit tests for input validation utilities."""
import pytest

from app.utils.validation import (
    sanitize_string,
    sanitize_html,
    validate_email,
    validate_url,
    validate_gpa,
    validate_grade,
    sanitize_dict,
)


class TestSanitizeString:
    """Tests for string sanitization."""

    def test_sanitize_normal_string(self):
        """Test sanitization of normal strings."""
        assert sanitize_string("Hello World") == "Hello World"
        assert sanitize_string("  Test  ") == "Test"
        assert sanitize_string("Valid-Name_123") == "Valid-Name_123"

    def test_sanitize_empty_string(self):
        """Test empty strings return None."""
        assert sanitize_string("") is None
        assert sanitize_string("   ") is None
        assert sanitize_string(None) is None

    def test_remove_null_bytes(self):
        """Test null byte removal."""
        result = sanitize_string("Hello\x00World")
        assert result == "HelloWorld"
        assert "\x00" not in result

    def test_max_length_enforcement(self):
        """Test maximum length is enforced."""
        long_string = "a" * 2000
        result = sanitize_string(long_string, max_length=100)
        assert len(result) == 100

    def test_preserve_unicode(self):
        """Test Unicode characters are preserved."""
        assert sanitize_string("Café") == "Café"
        assert sanitize_string("日本語") == "日本語"


class TestSanitizeHTML:
    """Tests for HTML sanitization."""

    def test_remove_html_tags(self):
        """Test HTML tags are removed."""
        assert sanitize_html("<p>Hello</p>") == "Hello"
        assert sanitize_html("<b>Bold</b> text") == "Bold text"
        assert sanitize_html("<div><span>Nested</span></div>") == "Nested"

    def test_remove_script_tags(self):
        """Test script tags and content are removed."""
        html = "Safe <script>alert('xss')</script> text"
        result = sanitize_html(html)
        assert "script" not in result.lower()
        assert "alert" not in result

    def test_decode_html_entities(self):
        """Test HTML entities are decoded."""
        assert sanitize_html("&lt;script&gt;") == "<script>"
        assert sanitize_html("&amp;") == "&"
        assert sanitize_html("&quot;test&quot;") == '"test"'

    def test_xss_prevention(self):
        """Test XSS attack vectors are neutralized."""
        xss_attempts = [
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
            "javascript:alert('xss')",
        ]
        for xss in xss_attempts:
            result = sanitize_html(xss)
            assert "alert" not in result
            assert "javascript" not in result.lower()


class TestValidateEmail:
    """Tests for email validation."""

    def test_valid_emails(self):
        """Test valid email formats."""
        valid_emails = [
            "user@example.com",
            "test.user@domain.co.uk",
            "name+tag@company.org",
        ]
        for email in valid_emails:
            result = validate_email(email)
            assert result == email.lower()

    def test_invalid_emails(self):
        """Test invalid email formats raise ValueError."""
        invalid_emails = [
            "notanemail",
            "@example.com",
            "user@",
            "user@.com",
            "user @example.com",
        ]
        for email in invalid_emails:
            with pytest.raises(ValueError, match="Invalid email format"):
                validate_email(email)

    def test_email_normalization(self):
        """Test emails are normalized to lowercase."""
        assert validate_email("USER@EXAMPLE.COM") == "user@example.com"
        assert validate_email("  test@domain.com  ") == "test@domain.com"

    def test_none_email(self):
        """Test None email returns None."""
        assert validate_email(None) is None


class TestValidateURL:
    """Tests for URL validation."""

    def test_valid_urls(self):
        """Test valid URL formats."""
        valid_urls = [
            "http://example.com",
            "https://www.example.com",
            "https://example.com/path/to/resource",
            "https://sub.domain.example.com:8080/path",
        ]
        for url in valid_urls:
            result = validate_url(url)
            assert result == url

    def test_invalid_protocols(self):
        """Test dangerous protocols are rejected."""
        dangerous_urls = [
            "javascript:alert('xss')",
            "data:text/html,<script>alert('xss')</script>",
            "file:///etc/passwd",
            "ftp://example.com",
        ]
        for url in dangerous_urls:
            with pytest.raises(ValueError):
                validate_url(url)

    def test_malformed_urls(self):
        """Test malformed URLs are rejected."""
        invalid_urls = [
            "not a url",
            "example.com",  # Missing protocol
            "http://",
            "https:// example.com",  # Space in URL
        ]
        for url in invalid_urls:
            with pytest.raises(ValueError):
                validate_url(url)

    def test_none_url(self):
        """Test None URL returns None."""
        assert validate_url(None) is None


class TestValidateGPA:
    """Tests for GPA validation."""

    def test_valid_gpa(self):
        """Test valid GPA values."""
        assert validate_gpa(15.5) == 15.5
        assert validate_gpa(0.0) == 0.0
        assert validate_gpa(20.0) == 20.0

    def test_invalid_gpa(self):
        """Test invalid GPA values raise ValueError."""
        with pytest.raises(ValueError, match="GPA must be between"):
            validate_gpa(-1.0)
        
        with pytest.raises(ValueError, match="GPA must be between"):
            validate_gpa(21.0)

    def test_custom_gpa_range(self):
        """Test custom GPA range validation."""
        assert validate_gpa(3.5, min_value=0.0, max_value=4.0) == 3.5
        
        with pytest.raises(ValueError):
            validate_gpa(4.5, min_value=0.0, max_value=4.0)

    def test_none_gpa(self):
        """Test None GPA returns None."""
        assert validate_gpa(None) is None


class TestValidateGrade:
    """Tests for grade validation."""

    def test_valid_grades(self):
        """Test valid grade values."""
        assert validate_grade(85.5) == 85.5
        assert validate_grade(0.0) == 0.0
        assert validate_grade(100.0) == 100.0

    def test_invalid_grades(self):
        """Test invalid grade values raise ValueError."""
        with pytest.raises(ValueError, match="Grade must be between"):
            validate_grade(-5.0)
        
        with pytest.raises(ValueError, match="Grade must be between"):
            validate_grade(105.0)

    def test_none_grade(self):
        """Test None grade returns None."""
        assert validate_grade(None) is None


class TestSanitizeDict:
    """Tests for dictionary sanitization."""

    def test_sanitize_flat_dict(self):
        """Test sanitization of flat dictionaries."""
        data = {
            "name": "  John Doe  ",
            "email": "test@example.com",
            "age": 25,
        }
        result = sanitize_dict(data)
        assert result["name"] == "John Doe"
        assert result["email"] == "test@example.com"
        assert result["age"] == 25

    def test_sanitize_nested_dict(self):
        """Test sanitization of nested dictionaries."""
        data = {
            "user": {
                "name": "  Jane  ",
                "profile": {
                    "bio": "  Developer  ",
                }
            }
        }
        result = sanitize_dict(data)
        assert result["user"]["name"] == "Jane"
        assert result["user"]["profile"]["bio"] == "Developer"

    def test_sanitize_dict_with_lists(self):
        """Test sanitization of dictionaries with lists."""
        data = {
            "subjects": ["  Math  ", "  Physics  "],
            "scores": [85, 90],
        }
        result = sanitize_dict(data)
        assert result["subjects"] == ["Math", "Physics"]
        assert result["scores"] == [85, 90]

    def test_remove_null_bytes_from_dict(self):
        """Test null bytes are removed from dict values."""
        data = {
            "text": "Hello\x00World",
            "nested": {
                "field": "Test\x00Data",
            }
        }
        result = sanitize_dict(data)
        assert "\x00" not in result["text"]
        assert "\x00" not in result["nested"]["field"]

    def test_enforce_max_length_in_dict(self):
        """Test max length is enforced in dict values."""
        data = {
            "long_text": "a" * 2000,
        }
        result = sanitize_dict(data, max_string_length=100)
        assert len(result["long_text"]) == 100
