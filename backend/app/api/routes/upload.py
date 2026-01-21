"""File upload endpoints for transcripts and documents."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.core.security import get_current_user
from app.models.user import User
from app.utils.file_upload import (
    handle_transcript_upload,
    delete_file,
    get_file_path,
)

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/transcript", status_code=status.HTTP_201_CREATED)
async def upload_transcript(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Upload a transcript file.
    
    - **Allowed file types:** PDF, JPG, PNG
    - **Maximum file size:** 5MB
    - **Authentication:** Required
    
    Returns:
        - filename: Unique filename on server
        - url: URL to access the file
        - original_filename: Original filename from upload
        - content_type: MIME type of the file
    """
    result = await handle_transcript_upload(file)
    return result


@router.delete("/files/{filename}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_uploaded_file(
    filename: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete an uploaded file.
    
    - **Authentication:** Required
    
    Note: This endpoint does not verify file ownership. In a production
    environment, you should track which user uploaded which files and
    verify ownership before deletion.
    """
    success = delete_file(filename)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )


@router.get("/files/{filename}")
async def get_uploaded_file(
    filename: str,
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """
    Retrieve an uploaded file.
    
    - **Authentication:** Required
    
    Returns the file for download or display in browser.
    
    Note: In production, consider serving files through a CDN or
    cloud storage service rather than directly from the API.
    """
    file_path = get_file_path(filename)
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Determine media type based on extension
    suffix = file_path.suffix.lower()
    media_type_map = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png"
    }
    
    media_type = media_type_map.get(suffix, "application/octet-stream")
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name
    )
