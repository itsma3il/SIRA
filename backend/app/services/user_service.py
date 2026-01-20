"""User service layer for business logic."""
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories import user_repository


def create_user_from_clerk(session: Session, clerk_user_id: str, email: str) -> User:
    return user_repository.create(session, clerk_user_id=clerk_user_id, email=email)


def get_user_by_clerk_id(session: Session, clerk_user_id: str) -> User | None:
    return user_repository.get_by_clerk_id(session, clerk_user_id=clerk_user_id)


def get_user_by_id(session: Session, user_id: UUID) -> User | None:
    return user_repository.get_by_id(session, user_id=user_id)


def ensure_user_email(session: Session, user: User, email: str | None) -> User:
    if email and user.email != email:
        return user_repository.update_email(session, user=user, email=email)
    return user
