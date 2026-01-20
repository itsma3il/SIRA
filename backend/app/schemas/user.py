"""User API schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserSyncRequest(BaseModel):
    """Request payload to sync a Clerk user."""

    email: str | None = None


class UserResponse(BaseModel):
    """User response schema."""

    id: UUID
    clerk_user_id: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
