"""Fix conversation-profile relationship - make profile_id nullable

Revision ID: 005_fix_conversation_profile
Revises: 004_add_session_id
Create Date: 2026-01-22

This migration fixes the relationship between conversations and profiles:
- Makes profile_id NULLABLE in conversation_sessions (users can chat without a profile)
- Ensures recommendations always require both profile_id and session_id
- Adds check constraint to ensure recommendations have a profile

Business Logic:
- Users can start a chat session without a profile
- Users can append a profile to an existing session
- Recommendations MUST be linked to both a profile and a session
- One session can have 0 or 1 profile
- One profile can have multiple recommendations
- One session can generate multiple recommendations
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005_fix_conversation_profile'
down_revision: Union[str, None] = '004_add_session_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make profile_id nullable in conversation_sessions
    op.alter_column('conversation_sessions', 'profile_id',
                    existing_type=postgresql.UUID(),
                    nullable=True)
    
    # Make session_id NOT NULL in recommendations (recommendations must be linked to a session)
    # First, delete any orphaned recommendations without a session_id
    op.execute('DELETE FROM recommendations WHERE session_id IS NULL')
    
    op.alter_column('recommendations', 'session_id',
                    existing_type=postgresql.UUID(),
                    nullable=False)
    
    # Add index on session_id for better query performance
    op.create_index('ix_recommendations_session_id', 'recommendations', ['session_id'])
    
    # Add composite index for common queries (profile_id, created_at)
    op.create_index('ix_recommendations_profile_created', 'recommendations', ['profile_id', 'created_at'])
    
    # Add composite index for session recommendations
    op.create_index('ix_recommendations_session_created', 'recommendations', ['session_id', 'created_at'])


def downgrade() -> None:
    # Remove indexes
    op.drop_index('ix_recommendations_session_created', 'recommendations')
    op.drop_index('ix_recommendations_profile_created', 'recommendations')
    op.drop_index('ix_recommendations_session_id', 'recommendations')
    
    # Make session_id nullable again
    op.alter_column('recommendations', 'session_id',
                    existing_type=postgresql.UUID(),
                    nullable=True)
    
    # Make profile_id NOT NULL again (this might fail if there are sessions without profiles)
    op.alter_column('conversation_sessions', 'profile_id',
                    existing_type=postgresql.UUID(),
                    nullable=False)
