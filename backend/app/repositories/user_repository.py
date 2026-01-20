"""User repository for database access."""
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User


def get_by_clerk_id(session: Session, clerk_user_id: str) -> User | None:
    return session.execute(select(User).where(User.clerk_user_id == clerk_user_id)).scalar_one_or_none()


def get_by_id(session: Session, user_id: UUID) -> User | None:
    return session.get(User, user_id)


def create(session: Session, clerk_user_id: str, email: str) -> User:
    user = User(clerk_user_id=clerk_user_id, email=email)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update_email(session: Session, user: User, email: str) -> User:
    user.email = email
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
