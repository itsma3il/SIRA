"""User sync and profile endpoints."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import get_session
from app.core.security import extract_email_from_claims, get_current_user, get_token_claims
from app.models.user import User
from app.schemas.user import UserResponse, UserSyncRequest
from app.services.user_service import create_user_from_clerk, ensure_user_email, get_user_by_clerk_id

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/sync", response_model=UserResponse)
async def sync_user(
    payload: UserSyncRequest,
    session: Session = Depends(get_session),
    claims: dict[str, Any] = Depends(get_token_claims),
) -> UserResponse:
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing subject in token")

    existing = get_user_by_clerk_id(session, clerk_user_id=clerk_user_id)
    email = payload.email or extract_email_from_claims(claims)
    if existing:
        if email:
            existing = ensure_user_email(session, user=existing, email=email)
        return existing

    if not email:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Email is required to sync")

    return create_user_from_clerk(session, clerk_user_id=clerk_user_id, email=email)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return current_user
