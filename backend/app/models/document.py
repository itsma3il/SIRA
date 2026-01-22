"""Document model for tracking ingested academic data."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db import Base


class Document(Base):
    """Tracks ingested documents and their metadata."""
    
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_file = Column(String(500), nullable=False, comment="Original file name or URL")
    document_type = Column(String(100), nullable=False, comment="Type: program_catalog, university_info, etc.")
    university = Column(String(255), nullable=True, comment="University name")
    program_name = Column(String(255), nullable=True, comment="Program/degree name")
    ingestion_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="active", nullable=False, comment="active, archived, error")
    document_metadata = Column(JSON, nullable=True, comment="Additional structured metadata")
    content_preview = Column(Text, nullable=True, comment="First 500 chars of content")
    vector_count = Column(String(50), nullable=True, comment="Number of vectors created")
    
    def __repr__(self):
        return f"<Document {self.university} - {self.program_name}>"
