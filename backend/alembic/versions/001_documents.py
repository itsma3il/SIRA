"""Add documents table for knowledge base tracking

Revision ID: 001_documents
Revises: 
Create Date: 2026-01-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '001_documents'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('source_file', sa.String(500), nullable=False, comment="Original file name or URL"),
        sa.Column('document_type', sa.String(100), nullable=False, comment="Type: program_catalog, university_info, etc."),
        sa.Column('university', sa.String(255), nullable=True, comment="University name"),
        sa.Column('program_name', sa.String(255), nullable=True, comment="Program/degree name"),
        sa.Column('ingestion_date', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('status', sa.String(50), nullable=False, server_default='active', comment="active, archived, error"),
        sa.Column('document_metadata', postgresql.JSONB(), nullable=True, comment="Additional structured metadata"),
        sa.Column('content_preview', sa.Text(), nullable=True, comment="First 500 chars of content"),
        sa.Column('vector_count', sa.String(50), nullable=True, comment="Number of vectors created"),
    )
    
    # Create indexes
    op.create_index('ix_documents_university', 'documents', ['university'])
    op.create_index('ix_documents_program_name', 'documents', ['program_name'])
    op.create_index('ix_documents_status', 'documents', ['status'])
    op.create_index('ix_documents_document_type', 'documents', ['document_type'])


def downgrade() -> None:
    op.drop_index('ix_documents_document_type', 'documents')
    op.drop_index('ix_documents_status', 'documents')
    op.drop_index('ix_documents_program_name', 'documents')
    op.drop_index('ix_documents_university', 'documents')
    op.drop_table('documents')
