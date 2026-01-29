"""Input validation utilities and sanitizers."""
import re
from typing import Any


def sanitize_string(value: str | None, max_length: int = 1000) -> str | None:
    """
    Sanitize string input by removing dangerous characters and limiting length.
    
    Args:
        value: Input string to sanitize
        max_length: Maximum allowed length
    
    Returns:
        Sanitized string or None
    """
    if value is None:
        return None
    
    # Strip whitespace
    value = value.strip()
    
    if not value:
        return None
    
    # Remove null bytes (can cause issues in databases)
    value = value.replace("\x00", "")
    
    # Limit length
    if len(value) > max_length:
        value = value[:max_length]
    
    return value


def sanitize_html(value: str | None) -> str | None:
    """
    Remove HTML tags and dangerous characters from input.
    
    Args:
        value: Input string potentially containing HTML
    
    Returns:
        Sanitized string without HTML tags
    """
    if value is None:
        return None
    
    # Remove HTML tags
    value = re.sub(r"<[^>]*>", "", value)
    
    # Remove script content
    value = re.sub(r"<script[^>]*>.*?</script>", "", value, flags=re.DOTALL | re.IGNORECASE)
    
    # Decode common HTML entities to prevent double-encoding
    html_entities = {
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&#x27;": "'",
        "&#x2F;": "/",
    }
    for entity, char in html_entities.items():
        value = value.replace(entity, char)
    
    return sanitize_string(value)


def validate_email(email: str | None) -> str | None:
    """
    Validate and normalize email address.
    
    Args:
        email: Email address to validate
    
    Returns:
        Normalized email or None if invalid
    
    Raises:
        ValueError: If email format is invalid
    """
    if email is None:
        return None
    
    email = email.strip().lower()
    
    # Basic email regex pattern
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    
    if not re.match(email_pattern, email):
        raise ValueError("Invalid email format")
    
    return email


def validate_url(url: str | None) -> str | None:
    """
    Validate URL format and protocol.
    
    Args:
        url: URL to validate
    
    Returns:
        Validated URL or None
    
    Raises:
        ValueError: If URL format is invalid or uses dangerous protocol
    """
    if url is None:
        return None
    
    url = url.strip()
    
    # Check for allowed protocols
    allowed_protocols = ["http://", "https://"]
    if not any(url.startswith(proto) for proto in allowed_protocols):
        raise ValueError("URL must start with http:// or https://")
    
    # Check for basic URL structure
    url_pattern = r"^https?://[a-zA-Z0-9.-]+(?:\:[0-9]+)?(?:/[^\s]*)?$"
    if not re.match(url_pattern, url):
        raise ValueError("Invalid URL format")
    
    # Check for dangerous patterns
    dangerous_patterns = ["javascript:", "data:", "file:", "vbscript:"]
    url_lower = url.lower()
    if any(pattern in url_lower for pattern in dangerous_patterns):
        raise ValueError("URL contains dangerous protocol")
    
    return url


def validate_gpa(gpa: float | None, min_value: float = 0.0, max_value: float = 20.0) -> float | None:
    """
    Validate GPA value is within acceptable range.
    
    Args:
        gpa: GPA value to validate
        min_value: Minimum allowed GPA
        max_value: Maximum allowed GPA
    
    Returns:
        Validated GPA or None
    
    Raises:
        ValueError: If GPA is out of range
    """
    if gpa is None:
        return None
    
    if gpa < min_value or gpa > max_value:
        raise ValueError(f"GPA must be between {min_value} and {max_value}")
    
    return gpa


def validate_grade(grade: float | None, min_value: float = 0.0, max_value: float = 100.0) -> float | None:
    """
    Validate individual grade value.
    
    Args:
        grade: Grade value to validate
        min_value: Minimum allowed grade
        max_value: Maximum allowed grade
    
    Returns:
        Validated grade or None
    
    Raises:
        ValueError: If grade is out of range
    """
    if grade is None:
        return None
    
    if grade < min_value or grade > max_value:
        raise ValueError(f"Grade must be between {min_value} and {max_value}")
    
    return grade


def sanitize_dict(data: dict[str, Any], max_string_length: int = 1000) -> dict[str, Any]:
    """
    Recursively sanitize dictionary values.
    
    Args:
        data: Dictionary to sanitize
        max_string_length: Maximum string length
    
    Returns:
        Sanitized dictionary
    """
    result = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = sanitize_string(value, max_string_length)
        elif isinstance(value, dict):
            result[key] = sanitize_dict(value, max_string_length)
        elif isinstance(value, list):
            result[key] = [
                sanitize_dict(item, max_string_length) if isinstance(item, dict)
                else sanitize_string(item, max_string_length) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            result[key] = value
    
    return result
