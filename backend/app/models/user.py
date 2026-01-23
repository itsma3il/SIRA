"""User model (Clerk-backed identity)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PostgreSQL_UUID
from sqlalchemy.orm import Mapped, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.profile import Profile


class User(Base):
    """
    Application user synced from Clerk authentication.
    
    This model represents the core user identity and serves as the root
    entity for all user-related data. Each user can have multiple profiles
    for different academic scenarios.
    
    Attributes:
        id: Unique identifier (UUID v4)
        clerk_user_id: External Clerk user identifier (unique, indexed)
        email: User's primary email address
        created_at: Timestamp of user creation (UTC)
        profiles: Collection of user profiles (one-to-many)
    """

    __tablename__ = "users"

    id: Mapped[UUID] = Column(
        PostgreSQL_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
        doc="Primary key (UUID v4)"
    )
    clerk_user_id: Mapped[str] = Column(
        String(255),
        index=True,
        unique=True,
        nullable=False,
        doc="Clerk authentication user ID"
    )
    email: Mapped[str] = Column(
        String(255),
        nullable=False,
        doc="User's email address"
    )
    created_at: Mapped[datetime] = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        doc="User creation timestamp (UTC)"
    )

    # Relationships - One-to-many
    profiles: Mapped[list["Profile"]] = relationship(back_populates="user")
    conversation_sessions = relationship("ConversationSession", back_populates="user", cascade="all, delete-orphan")
