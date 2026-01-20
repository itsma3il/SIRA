"""User repository for database access."""
from uuid import UUID

from sqlmodel import Session, select

from app.models.user import User


def get_by_clerk_id(session: Session, clerk_user_id: str) -> User | None:
    return session.exec(select(User).where(User.clerk_user_id == clerk_user_id)).first()


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
