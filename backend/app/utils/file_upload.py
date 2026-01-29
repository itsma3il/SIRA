"""File upload utilities for handling transcript and document uploads."""
import os
import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import UploadFile, HTTPException, status


# Configuration
UPLOAD_DIR = Path("/app/uploads/transcripts")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png"
}


def ensure_upload_dir() -> None:
    """Ensure the upload directory exists with secure permissions."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    # Set directory permissions (owner read/write/execute only)
    os.chmod(UPLOAD_DIR, 0o700)


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and other attacks.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove any directory components
    filename = os.path.basename(filename)
    
    # Remove dangerous characters
    # Keep only alphanumeric, dots, hyphens, underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Prevent hidden files
    if filename.startswith('.'):
        filename = '_' + filename
    
    # Limit length
    if len(filename) > 255:
        ext = Path(filename).suffix
        filename = filename[:255-len(ext)] + ext
    
    return filename


def validate_file_type(filename: str, content_type: str) -> None:
    """
    Validate file extension and MIME type.
    
    Args:
        filename: Name of the file
        content_type: MIME type from upload
        
    Raises:
        HTTPException: If file type is not allowed
    """
    file_ext = Path(filename).suffix.lower()
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file content type. Allowed: PDF, JPG, PNG"
        )


async def validate_file_size(file: UploadFile) -> None:
    """
    Validate file size by reading the file.
    
    Args:
        file: Uploaded file
        
    Raises:
        HTTPException: If file is too large
    """
    # Read file to check size
    content = await file.read()
    file_size = len(content)
    
    # Reset file position for later use
    await file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        size_mb = file_size / (1024 * 1024)
        max_mb = MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large ({size_mb:.2f}MB). Maximum size: {max_mb}MB"
        )


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate a unique filename while preserving the extension.
    
    Args:
        original_filename: Original filename from upload
        
    Returns:
        Unique filename with UUID prefix (sanitized)
    """
    # Sanitize the original filename first
    sanitized = sanitize_filename(original_filename)
    
    file_ext = Path(sanitized).suffix.lower()
    unique_id = uuid.uuid4().hex[:16]
    
    # Use only UUID and extension to prevent any path traversal
    return f"{unique_id}{file_ext}"


async def save_upload_file(file: UploadFile) -> str:
    """
    Save uploaded file to disk.
    
    Args:
        file: Uploaded file
        
    Returns:
        Filename of saved file
        
    Raises:
        HTTPException: If save operation fails
    """
    try:
        ensure_upload_dir()
        
        # Generate unique filename
        filename = generate_unique_filename(file.filename)
        file_path = UPLOAD_DIR / filename
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        return filename
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )


def delete_file(filename: str) -> bool:
    """
    Delete a file from the upload directory.
    
    Args:
        filename: Name of file to delete
        
    Returns:
        True if file was deleted, False if file not found
        
    Raises:
        HTTPException: If deletion fails
    """
    try:
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            return False
        
        # Ensure the file is within the upload directory (security check)
        if not str(file_path.resolve()).startswith(str(UPLOAD_DIR.resolve())):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path"
            )
        
        file_path.unlink()
        return True
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )


def get_file_path(filename: str) -> Optional[Path]:
    """
    Get the full path to an uploaded file.
    
    Args:
        filename: Name of the file
        
    Returns:
        Path object if file exists, None otherwise
    """
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        return None
    
    # Security check
    if not str(file_path.resolve()).startswith(str(UPLOAD_DIR.resolve())):
        return None
    
    return file_path


def get_file_url(filename: str, base_url: str = "") -> str:
    """
    Generate a URL for accessing an uploaded file.
    
    Args:
        filename: Name of the file
        base_url: Base URL of the application
        
    Returns:
        Full URL to access the file
    """
    # In production, this would return a cloud storage URL (S3, Azure Blob, etc.)
    # For now, we return a relative URL that can be served by the backend
    return f"{base_url}/api/upload/files/{filename}"


async def handle_transcript_upload(file: UploadFile) -> dict:
    """
    Handle complete transcript upload flow.
    
    Args:
        file: Uploaded file
        
    Returns:
        Dictionary with filename and URL
        
    Raises:
        HTTPException: If validation or save fails
    """
    # Validate file type
    validate_file_type(file.filename, file.content_type)
    
    # Validate file size
    await validate_file_size(file)
    
    # Save file
    filename = await save_upload_file(file)
    
    # Generate URL
    file_url = get_file_url(filename)
    
    return {
        "filename": filename,
        "url": file_url,
        "original_filename": file.filename,
        "content_type": file.content_type
    }
