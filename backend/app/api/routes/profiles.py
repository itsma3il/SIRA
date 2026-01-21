"""Profile management endpoints."""
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.profile import (
    ProfileCreate,
    ProfileUpdate,
    ProfileStatusUpdate,
    ProfileResponse,
    ProfileListResponse,
)
from app.services import profile_service

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ProfileResponse:
    """
    Create a new profile for the current user.
    
    - **profile_name**: Name for this profile (e.g., "Computer Science Track")
    - **status**: Profile status (draft, active, archived)
    - **academic_record**: Optional academic information
    - **preferences**: Optional student preferences and constraints
    """
    profile = profile_service.create_profile(
        session=session,
        user_id=current_user.id,
        profile_data=payload
    )
    return profile


@router.get("", response_model=list[ProfileListResponse])
async def list_profiles(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[ProfileListResponse]:
    """
    Get all profiles for the current user.
    
    Returns a simplified list without nested academic records and preferences
    for better performance. Use GET /profiles/{profile_id} for full details.
    """
    profiles = profile_service.get_user_profiles(session, current_user.id)
    return profiles


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ProfileResponse:
    """
    Get a specific profile by ID with all related data.
    
    Includes academic records, subject grades, and student preferences.
    """
    profile = profile_service.get_profile_by_id(session, profile_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Authorization check: user can only access their own profiles
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this profile"
        )
    
    return profile


@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: UUID,
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ProfileResponse:
    """
    Update a profile and its related data.
    
    All fields are optional. Only provided fields will be updated.
    """
    profile = profile_service.get_profile_by_id(session, profile_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Authorization check
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this profile"
        )
    
    updated_profile = profile_service.update_profile(
        session=session,
        profile=profile,
        profile_data=payload
    )
    
    return updated_profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """
    Delete a profile and all its related data.
    
    This action cannot be undone.
    """
    profile = profile_service.get_profile_by_id(session, profile_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Authorization check
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this profile"
        )
    
    profile_service.delete_profile(session, profile)


@router.patch("/{profile_id}/status", response_model=ProfileResponse)
async def change_profile_status(
    profile_id: UUID,
    payload: ProfileStatusUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ProfileResponse:
    """
    Change the status of a profile.
    
    Valid statuses: draft, active, archived
    """
    profile = profile_service.get_profile_by_id(session, profile_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Authorization check
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this profile"
        )
    
    # Validate status value
    valid_statuses = ["draft", "active", "archived"]
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    updated_profile = profile_service.change_profile_status(
        session=session,
        profile=profile,
        new_status=payload.status
    )
    
    return updated_profile
