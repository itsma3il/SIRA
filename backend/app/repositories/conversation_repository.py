"""Repository for conversation session operations."""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_

from app.models.conversation import ConversationSession, ConversationMessage


def create_session(
    db: Session,
    user_id: UUID,
    profile_id: Optional[UUID],  # Can be None
    title: str
) -> ConversationSession:
    """
    Create a new conversation session.
    
    Note: profile_id is optional. Users can chat without a profile.
    """
    session = ConversationSession(
        user_id=user_id,
        profile_id=profile_id,  # Can be None
        title=title,
        status="active"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_by_id(db: Session, session_id: UUID) -> Optional[ConversationSession]:
    """Get session by ID with profile loaded."""
    return db.query(ConversationSession).options(
        joinedload(ConversationSession.profile),
        joinedload(ConversationSession.recommendations)
    ).filter(ConversationSession.id == session_id).first()


def get_by_id_with_messages(db: Session, session_id: UUID) -> Optional[ConversationSession]:
    """Get session by ID with all messages and profile loaded."""
    return db.query(ConversationSession).options(
        joinedload(ConversationSession.profile),
        joinedload(ConversationSession.messages),
        joinedload(ConversationSession.recommendations)
    ).filter(ConversationSession.id == session_id).first()


def get_by_user(
    db: Session,
    user_id: UUID,
    profile_id: Optional[UUID] = None,
    status: Optional[str] = "active",  # Default to active sessions only
    limit: int = 50
) -> List[ConversationSession]:
    """Get sessions for a user, optionally filtered by profile and status."""
    query = db.query(ConversationSession).options(
        joinedload(ConversationSession.profile)
    ).filter(ConversationSession.user_id == user_id)
    
    if profile_id:
        query = query.filter(ConversationSession.profile_id == profile_id)
    
    if status:
        query = query.filter(ConversationSession.status == status)
    
    return query.order_by(desc(ConversationSession.last_message_at), desc(ConversationSession.created_at)).limit(limit).all()


def update(db: Session, session_id: UUID, updates: dict) -> Optional[ConversationSession]:
    """Update session fields."""
    session = db.query(ConversationSession).filter(ConversationSession.id == session_id).first()
    if not session:
        return None
    
    for key, value in updates.items():
        if hasattr(session, key):
            setattr(session, key, value)
    
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


def delete(db: Session, session_id: UUID) -> bool:
    """Delete a session (cascades to messages)."""
    session = db.query(ConversationSession).filter(ConversationSession.id == session_id).first()
    if not session:
        return False
    
    db.delete(session)
    db.commit()
    return True


def add_message(
    db: Session,
    session_id: UUID,
    role: str,
    content: str,
    message_metadata: Optional[dict] = None
) -> ConversationMessage:
    """Add a message to a session and update last_message_at."""
    message = ConversationMessage(
        session_id=session_id,
        role=role,
        content=content,
        message_metadata=message_metadata  # Use the correct column name
    )
    db.add(message)
    
    # Update session's last_message_at
    db.query(ConversationSession).filter(
        ConversationSession.id == session_id
    ).update({
        "last_message_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    db.commit()
    db.refresh(message)
    return message


def get_messages(
    db: Session,
    session_id: UUID,
    limit: Optional[int] = None
) -> List[ConversationMessage]:
    """Get all messages for a session."""
    query = db.query(ConversationMessage).filter(
        ConversationMessage.session_id == session_id
    ).order_by(ConversationMessage.created_at)
    
    if limit:
        query = query.limit(limit)
    
    return query.all()


def get_recent_messages(
    db: Session,
    session_id: UUID,
    limit: int = 10
) -> List[ConversationMessage]:
    """Get the most recent N messages for a session."""
    return db.query(ConversationMessage).filter(
        ConversationMessage.session_id == session_id
    ).order_by(desc(ConversationMessage.created_at)).limit(limit).all()[::-1]  # Reverse to get chronological order


def get_message_count(db: Session, session_id: UUID) -> int:
    """Get total message count for a session."""
    return db.query(ConversationMessage).filter(
        ConversationMessage.session_id == session_id
    ).count()


def group_sessions_by_period(sessions: List[ConversationSession]) -> List[dict]:
    """Group sessions by time periods: Today, Yesterday, Last 7 days, Last month."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    week_ago = today_start - timedelta(days=7)
    month_ago = today_start - timedelta(days=30)
    
    grouped = {
        "Today": [],
        "Yesterday": [],
        "Last 7 days": [],
        "Last month": [],
    }
    
    for session in sessions:
        timestamp = session.last_message_at or session.created_at
        
        if timestamp >= today_start:
            grouped["Today"].append(session)
        elif timestamp >= yesterday_start:
            grouped["Yesterday"].append(session)
        elif timestamp >= week_ago:
            grouped["Last 7 days"].append(session)
        elif timestamp >= month_ago:
            grouped["Last month"].append(session)
    
    # Convert to list of period groups (remove empty periods)
    return [
        {"period": period, "sessions": sessions_list}
        for period, sessions_list in grouped.items()
        if sessions_list
    ]


def group_sessions_by_period_with_items(session_items: List[dict]) -> List[dict]:
    """
    Group session items (dicts) by time periods.
    
    This is used for the session list API response where sessions are
    already transformed into dicts with computed fields.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Grouping {len(session_items)} session items")
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    week_ago = today_start - timedelta(days=7)
    month_ago = today_start - timedelta(days=30)
    
    logger.info(f"Time boundaries - Today: {today_start}, Yesterday: {yesterday_start}, Week: {week_ago}, Month: {month_ago}")
    
    grouped = {
        "Today": [],
        "Yesterday": [],
        "Last 7 days": [],
        "Last month": [],
    }
    
    for item in session_items:
        timestamp = item.get("last_message_at") or item.get("created_at")
        logger.info(f"Session {item.get('id')}: timestamp={timestamp}, last_message_at={item.get('last_message_at')}, created_at={item.get('created_at')}")
        if not timestamp:
            # Skip sessions without any timestamp
            logger.warning(f"Skipping session {item.get('id')} - no timestamp")
            continue
            
        if timestamp >= today_start:
            grouped["Today"].append(item)
            logger.info(f"  -> Added to Today")
        elif timestamp >= yesterday_start:
            grouped["Yesterday"].append(item)
            logger.info(f"  -> Added to Yesterday")
        elif timestamp >= week_ago:
            grouped["Last 7 days"].append(item)
            logger.info(f"  -> Added to Last 7 days")
        elif timestamp >= month_ago:
            grouped["Last month"].append(item)
            logger.info(f"  -> Added to Last month")
        else:
            logger.warning(f"  -> Not added to any group (too old)")
    
    # Convert to list of period groups (remove empty periods)
    result = [
        {"period": period, "sessions": sessions_list}
        for period, sessions_list in grouped.items()
        if sessions_list
    ]
    
    logger.info(f"Grouping result: {len(result)} groups with {sum(len(g['sessions']) for g in result)} total sessions")
    return result

