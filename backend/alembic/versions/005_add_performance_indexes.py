"""Add performance indexes

Revision ID: 005_add_performance_indexes
Revises: 004_add_session_id_to_recommendations
Create Date: 2026-01-29 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_performance_indexes'
down_revision = '004_add_session_id_to_recommendations'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add indexes for frequently queried fields."""
    
    # User profiles indexes
    op.create_index(
        'idx_user_profiles_clerk_id',
        'user_profiles',
        ['clerk_id'],
        unique=False
    )
    op.create_index(
        'idx_user_profiles_created_at',
        'user_profiles',
        ['created_at'],
        unique=False
    )
    
    # Recommendations indexes
    op.create_index(
        'idx_recommendations_user_id',
        'recommendations',
        ['user_id'],
        unique=False
    )
    op.create_index(
        'idx_recommendations_session_id',
        'recommendations',
        ['session_id'],
        unique=False
    )
    op.create_index(
        'idx_recommendations_created_at',
        'recommendations',
        ['created_at'],
        unique=False
    )
    op.create_index(
        'idx_recommendations_match_score',
        'recommendations',
        ['match_score'],
        unique=False
    )
    
    # Composite index for common query pattern (user + date range)
    op.create_index(
        'idx_recommendations_user_created',
        'recommendations',
        ['user_id', 'created_at'],
        unique=False
    )
    
    # Documents indexes
    op.create_index(
        'idx_documents_user_id',
        'documents',
        ['user_id'],
        unique=False
    )
    op.create_index(
        'idx_documents_type',
        'documents',
        ['document_type'],
        unique=False
    )
    op.create_index(
        'idx_documents_uploaded_at',
        'documents',
        ['uploaded_at'],
        unique=False
    )
    
    # Composite index for user documents
    op.create_index(
        'idx_documents_user_type',
        'documents',
        ['user_id', 'document_type'],
        unique=False
    )
    
    # Conversation messages indexes
    op.create_index(
        'idx_messages_session_id',
        'conversation_messages',
        ['session_id'],
        unique=False
    )
    op.create_index(
        'idx_messages_created_at',
        'conversation_messages',
        ['created_at'],
        unique=False
    )
    
    # Composite index for session messages (ordered)
    op.create_index(
        'idx_messages_session_created',
        'conversation_messages',
        ['session_id', 'created_at'],
        unique=False
    )
    
    # Conversation sessions indexes
    op.create_index(
        'idx_sessions_user_id',
        'conversation_sessions',
        ['user_id'],
        unique=False
    )
    op.create_index(
        'idx_sessions_created_at',
        'conversation_sessions',
        ['created_at'],
        unique=False
    )
    op.create_index(
        'idx_sessions_updated_at',
        'conversation_sessions',
        ['updated_at'],
        unique=False
    )


def downgrade() -> None:
    """Remove performance indexes."""
    
    # User profiles indexes
    op.drop_index('idx_user_profiles_clerk_id', table_name='user_profiles')
    op.drop_index('idx_user_profiles_created_at', table_name='user_profiles')
    
    # Recommendations indexes
    op.drop_index('idx_recommendations_user_id', table_name='recommendations')
    op.drop_index('idx_recommendations_session_id', table_name='recommendations')
    op.drop_index('idx_recommendations_created_at', table_name='recommendations')
    op.drop_index('idx_recommendations_match_score', table_name='recommendations')
    op.drop_index('idx_recommendations_user_created', table_name='recommendations')
    
    # Documents indexes
    op.drop_index('idx_documents_user_id', table_name='documents')
    op.drop_index('idx_documents_type', table_name='documents')
    op.drop_index('idx_documents_uploaded_at', table_name='documents')
    op.drop_index('idx_documents_user_type', table_name='documents')
    
    # Conversation messages indexes
    op.drop_index('idx_messages_session_id', table_name='conversation_messages')
    op.drop_index('idx_messages_created_at', table_name='conversation_messages')
    op.drop_index('idx_messages_session_created', table_name='conversation_messages')
    
    # Conversation sessions indexes
    op.drop_index('idx_sessions_user_id', table_name='conversation_sessions')
    op.drop_index('idx_sessions_created_at', table_name='conversation_sessions')
    op.drop_index('idx_sessions_updated_at', table_name='conversation_sessions')
