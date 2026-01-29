"""Database engine and session management with connection pooling."""
import logging
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, declarative_base

from app.core.config import get_settings

logger = logging.getLogger(__name__)

Base = declarative_base()


def _engine_url() -> str:
    return get_settings().database_url


def get_engine():
    """
    Get database engine with optimized connection pooling.
    
    Configuration:
    - pool_pre_ping: Verify connections before using (prevents stale connections)
    - pool_size: Maintain 10 connections in the pool
    - max_overflow: Allow up to 20 additional connections
    - pool_recycle: Recycle connections after 1 hour
    - pool_timeout: Wait 30 seconds for available connection
    """
    engine = create_engine(
        _engine_url(),
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        pool_timeout=30,
        echo=False,  # Set to True for SQL query logging
        connect_args={
            "connect_timeout": 10,
        },
    )
    
    # Log connection pool events in debug mode
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_conn, connection_record):
        logger.debug("New database connection established")
    
    return engine


@contextmanager
def session_scope() -> Iterator[Session]:
    """
    Provide a transactional scope around a series of operations.
    
    Usage:
        with session_scope() as session:
            # perform database operations
            session.add(obj)
            # commit happens automatically on success
            # rollback happens automatically on exception
    """
    engine = get_engine()
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise


def init_db() -> None:
    """
    Create database tables if they do not exist.
    
    Note: In production, use Alembic migrations instead of create_all.
    """
    # Import models here to ensure they're registered with Base.metadata
    from app import models
    
    logger.info("Initializing database schema...")
    engine = get_engine()
    
    try:
        Base.metadata.create_all(engine)
        logger.info("✓ Database schema initialized successfully")
    except Exception as e:
        logger.error(f"✗ Database initialization failed: {e}")
        raise

