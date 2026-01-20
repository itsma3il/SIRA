"""API dependencies."""
from collections.abc import Generator

from sqlalchemy.orm import Session

from app.db import get_engine


def get_session() -> Generator[Session, None, None]:
    engine = get_engine()
    with Session(engine) as session:
        yield session
