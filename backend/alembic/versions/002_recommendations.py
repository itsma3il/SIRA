"""Create recommendations table

Revision ID: 002_recommendations
Revises: 001_documents
Create Date: 2026-01-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = '002_recommendations'
down_revision = '001_documents'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'recommendations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('profile_id', UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('query', sa.Text, nullable=False),
        sa.Column('retrieved_context', JSONB, nullable=True),
        sa.Column('ai_response', sa.Text, nullable=False),
        sa.Column('structured_data', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('feedback_rating', sa.Integer, nullable=True),
        sa.Column('feedback_comment', sa.Text, nullable=True),
    )
    
    # Create indexes for performance
    op.create_index('ix_recommendations_profile_id', 'recommendations', ['profile_id'])
    op.create_index('ix_recommendations_created_at', 'recommendations', ['created_at'])
    op.create_index('ix_recommendations_feedback_rating', 'recommendations', ['feedback_rating'])


def downgrade() -> None:
    op.drop_index('ix_recommendations_feedback_rating')
    op.drop_index('ix_recommendations_created_at')
    op.drop_index('ix_recommendations_profile_id')
    op.drop_table('recommendations')
