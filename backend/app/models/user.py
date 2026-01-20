"""User model (Clerk-backed identity)."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.profile import Profile


class User(SQLModel, table=True):
    """Application user synced from Clerk."""

    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    clerk_user_id: str = Field(index=True, unique=True, nullable=False, max_length=255)
    email: str = Field(nullable=False, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    profiles: list["Profile"] = Relationship(back_populates="user")
