"""Add conversation sessions and messages tables

Revision ID: 003_conversation_system
Revises: 002_recommendations
Create Date: 2026-01-22 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_conversation_system'
down_revision = '002_recommendations'
branch_labels = None
depends_on = None


def upgrade():
    # Create conversation_sessions table
    op.create_table(
        'conversation_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False, comment='Auto-generated or user-set session title'),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False, comment='active or archived'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_message_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_conversation_sessions_user_id', 'conversation_sessions', ['user_id'])
    op.create_index('ix_conversation_sessions_profile_id', 'conversation_sessions', ['profile_id'])
    op.create_index('ix_conversation_sessions_status', 'conversation_sessions', ['status'])
    op.create_index('ix_conversation_sessions_last_message_at', 'conversation_sessions', ['last_message_at'])
    
    # Create conversation_messages table
    op.create_table(
        'conversation_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, comment='user, assistant, or system'),
        sa.Column('content', sa.Text(), nullable=False, comment='Message content in markdown format'),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='Additional data: model, tokens, etc.'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['conversation_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_conversation_messages_session_id', 'conversation_messages', ['session_id'])
    op.create_index('ix_conversation_messages_created_at', 'conversation_messages', ['created_at'])
    
    # Add session_id column to recommendations table
    op.add_column('recommendations', sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_recommendations_session_id', 'recommendations', 'conversation_sessions', ['session_id'], ['id'], ondelete='CASCADE')


def downgrade():
    # Remove session_id from recommendations
    op.drop_constraint('fk_recommendations_session_id', 'recommendations', type_='foreignkey')
    op.drop_column('recommendations', 'session_id')
    
    # Drop conversation_messages table
    op.drop_index('ix_conversation_messages_created_at', 'conversation_messages')
    op.drop_index('ix_conversation_messages_session_id', 'conversation_messages')
    op.drop_table('conversation_messages')
    
    # Drop conversation_sessions table
    op.drop_index('ix_conversation_sessions_last_message_at', 'conversation_sessions')
    op.drop_index('ix_conversation_sessions_status', 'conversation_sessions')
    op.drop_index('ix_conversation_sessions_profile_id', 'conversation_sessions')
    op.drop_index('ix_conversation_sessions_user_id', 'conversation_sessions')
    op.drop_table('conversation_sessions')
