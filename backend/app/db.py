"""Database engine and session management."""
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base

from app.core.config import get_settings

Base = declarative_base()


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
    # Import models here to ensure they're registered with Base.metadata
    from app import models
    
    engine = get_engine()
    Base.metadata.create_all(engine)
