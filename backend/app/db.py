"""Database engine and session management."""
from collections.abc import Iterator
from contextlib import contextmanager

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings


def _engine_url() -> str:
    return get_settings().database_url


def get_engine():
    return create_engine(_engine_url(), pool_pre_ping=True)


@contextmanager
def session_scope() -> Iterator[Session]:
    """Provide a transactional scope around a series of operations."""
    engine = get_engine()
    with Session(engine) as session:
        yield session


def init_db() -> None:
    """Create database tables if they do not exist."""
    engine = get_engine()
    SQLModel.metadata.create_all(engine)
