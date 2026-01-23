"""Fix profile_id foreign key to SET NULL on delete

Revision ID: 006_fix_profile_fk_set_null
Revises: 005_fix_conversation_profile
Create Date: 2026-01-22

This migration properly fixes the foreign key constraint to SET NULL
instead of CASCADE when a profile is deleted.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '006_fix_profile_fk_set_null'
down_revision: Union[str, None] = '005_fix_conversation_profile'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing foreign key constraint
    op.drop_constraint(
        'conversation_sessions_profile_id_fkey',
        'conversation_sessions',
        type_='foreignkey'
    )
    
    # Recreate foreign key with SET NULL behavior
    op.create_foreign_key(
        'conversation_sessions_profile_id_fkey',
        'conversation_sessions',
        'profiles',
        ['profile_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Drop SET NULL foreign key
    op.drop_constraint(
        'conversation_sessions_profile_id_fkey',
        'conversation_sessions',
        type_='foreignkey'
    )
    
    # Recreate with CASCADE (original behavior)
    op.create_foreign_key(
        'conversation_sessions_profile_id_fkey',
        'conversation_sessions',
        'profiles',
        ['profile_id'],
        ['id'],
        ondelete='CASCADE'
    )
