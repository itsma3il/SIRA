"""add session_id to recommendations

Revision ID: 004_add_session_id
Revises: 003_conversation_system
Create Date: 2026-01-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004_add_session_id'
down_revision: Union[str, None] = '003_conversation_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add session_id column to recommendations table
    op.add_column('recommendations', 
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_recommendations_session_id_conversation_sessions',
        'recommendations', 'conversation_sessions',
        ['session_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint(
        'fk_recommendations_session_id_conversation_sessions',
        'recommendations',
        type_='foreignkey'
    )
    
    # Drop session_id column
    op.drop_column('recommendations', 'session_id')
