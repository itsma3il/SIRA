"""
Data ingestion script for SIRA academic programs.

This script processes academic program data (JSON, PDF, or text files),
generates embeddings using Mistral AI, and stores vectors in Pinecone.

Usage:
    python ingest_data.py --file path/to/data.json
    python ingest_data.py --directory path/to/data/
    python ingest_data.py --sample  # Ingest sample data
"""

import json
import logging
import sys
import os
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import argparse

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter
from sqlalchemy.orm import Session

# Import app modules
from backend.app.core.config import get_settings
from backend.app.core.vector_db import get_pinecone_manager
from backend.app.db import SessionLocal
from backend.app.models.document import Document as DBDocument

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


def load_json_file(file_path: Path) -> List[Dict[str, Any]]:
    """
    Load programs from JSON file.
    
    Args:
        file_path: Path to JSON file
        
    Returns:
        List of program dictionaries
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Handle both single object and array
    if isinstance(data, dict):
        return [data]
    return data


def program_to_text(program: Dict[str, Any]) -> str:
    """
    Convert program dictionary to structured text for embedding.
    
    Args:
        program: Program dictionary
        
    Returns:
        Formatted text representation
    """
    text_parts = []
    
    # Basic info
    text_parts.append(f"University: {program.get('university', 'Unknown')}")
    text_parts.append(f"Program: {program.get('program_name', 'Unknown')}")
    text_parts.append(f"Degree Type: {program.get('degree_type', 'Unknown')}")
    text_parts.append(f"Field: {program.get('field', 'Unknown')}")
    
    if program.get('subfield'):
        text_parts.append(f"Subfield: {program['subfield']}")
    
    text_parts.append(f"Location: {program.get('location', 'Unknown')}")
    text_parts.append(f"Duration: {program.get('duration_years', 'Unknown')} years")
    text_parts.append(f"Tuition Fee: {program.get('tuition_fee_mad', 'Unknown')} MAD/year")
    text_parts.append(f"Language: {program.get('language_of_instruction', 'Unknown')}")
    
    # Requirements
    if 'requirements' in program:
        req = program['requirements']
        text_parts.append(f"\nAdmission Requirements:")
        if 'min_gpa' in req:
            text_parts.append(f"- Minimum GPA: {req['min_gpa']}/20")
        if 'required_subjects' in req:
            text_parts.append(f"- Required Subjects: {', '.join(req['required_subjects'])}")
    
    # Description
    if program.get('description'):
        text_parts.append(f"\nProgram Description:")
        text_parts.append(program['description'])
    
    # Curriculum
    if program.get('curriculum_overview'):
        text_parts.append(f"\nCurriculum Overview:")
        curr = program['curriculum_overview']
        for year, content in curr.items():
            text_parts.append(f"- {year}: {content}")
    
    # Career paths
    if program.get('career_paths'):
        text_parts.append(f"\nCareer Opportunities:")
        text_parts.append(f"Graduates can pursue careers as: {', '.join(program['career_paths'])}")
    
    # Additional info
    if program.get('scholarships_available'):
        text_parts.append(f"\nScholarships: Available")
        if program.get('scholarship_details'):
            text_parts.append(f"Details: {program['scholarship_details']}")
    
    if program.get('admission_rate_percentage'):
        text_parts.append(f"Admission Rate: ~{program['admission_rate_percentage']}%")
    
    return "\n".join(text_parts)


def create_llama_documents(programs: List[Dict[str, Any]]) -> List[Document]:
    """
    Convert program dictionaries to LlamaIndex Document objects.
    
    Args:
        programs: List of program dictionaries
        
    Returns:
        List of LlamaIndex Document objects
    """
    documents = []
    
    for program in programs:
        text = program_to_text(program)
        
        # Create metadata for filtering
        metadata = {
            "university": program.get("university", "Unknown"),
            "program_name": program.get("program_name", "Unknown"),
            "degree_type": program.get("degree_type", "Unknown"),
            "field": program.get("field", "Unknown"),
            "location": program.get("location", "Unknown"),
            "tuition_fee_mad": program.get("tuition_fee_mad", 0),
            "language": program.get("language_of_instruction", "Unknown"),
        }
        
        # Add numeric metadata for filtering
        if "requirements" in program and "min_gpa" in program["requirements"]:
            metadata["min_gpa"] = float(program["requirements"]["min_gpa"])
        
        if "admission_rate_percentage" in program:
            metadata["admission_rate"] = int(program["admission_rate_percentage"])
        
        # Create document
        doc = Document(
            text=text,
            metadata=metadata,
            excluded_llm_metadata_keys=["source_file"],  # Don't send to LLM
            excluded_embed_metadata_keys=[]  # Include all in embeddings
        )
        
        documents.append(doc)
    
    logger.info(f"Created {len(documents)} LlamaIndex documents")
    return documents


def chunk_documents(documents: List[Document]) -> List[Document]:
    """
    Split documents into chunks for better retrieval.
    
    Args:
        documents: List of LlamaIndex documents
        
    Returns:
        List of chunked documents
    """
    splitter = SentenceSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    
    nodes = splitter.get_nodes_from_documents(documents)
    logger.info(f"Split into {len(nodes)} chunks")
    
    return nodes


def save_to_database(
    db: Session,
    programs: List[Dict[str, Any]],
    source_file: str,
    vector_count: int
) -> None:
    """
    Save ingestion record to PostgreSQL.
    
    Args:
        db: Database session
        programs: List of ingested programs
        source_file: Source file name
        vector_count: Number of vectors created
    """
    for program in programs:
        # Create preview (first 500 chars)
        text = program_to_text(program)
        preview = text[:500] + "..." if len(text) > 500 else text
        
        db_doc = DBDocument(
            source_file=source_file,
            document_type="program_catalog",
            university=program.get("university"),
            program_name=program.get("program_name"),
            ingestion_date=datetime.utcnow(),
            status="active",
            document_metadata=program,
            content_preview=preview,
            vector_count=str(vector_count)
        )
        
        db.add(db_doc)
    
    db.commit()
    logger.info(f"Saved {len(programs)} records to database")


def ingest_file(file_path: Path, db: Session) -> None:
    """
    Ingest a single file into the knowledge base.
    
    Args:
        file_path: Path to file to ingest
        db: Database session
    """
    logger.info(f"Processing file: {file_path}")
    
    # Load programs
    if file_path.suffix == '.json':
        programs = load_json_file(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_path.suffix}")
    
    logger.info(f"Loaded {len(programs)} programs")
    
    # Convert to LlamaIndex documents
    documents = create_llama_documents(programs)
    
    # Chunk documents
    chunks = chunk_documents(documents)
    
    # Get Pinecone manager
    pinecone_manager = get_pinecone_manager()
    
    # Create index if not exists
    pinecone_manager.create_index_if_not_exists()
    
    # Index documents
    logger.info("Indexing documents in Pinecone...")
    index = pinecone_manager.create_index_from_documents(chunks)
    logger.info(f"Successfully indexed {len(chunks)} chunks")
    
    # Save to database
    save_to_database(db, programs, file_path.name, len(chunks))
    
    logger.info(f"✅ Ingestion complete for {file_path.name}")


def ingest_directory(dir_path: Path, db: Session) -> None:
    """
    Ingest all JSON files in a directory.
    
    Args:
        dir_path: Path to directory
        db: Database session
    """
    json_files = list(dir_path.glob("*.json"))
    logger.info(f"Found {len(json_files)} JSON files in {dir_path}")
    
    for file_path in json_files:
        try:
            ingest_file(file_path, db)
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")


def main():
    """Main entry point for the ingestion script."""
    parser = argparse.ArgumentParser(description="Ingest academic program data into SIRA")
    parser.add_argument("--file", type=str, help="Path to single JSON file")
    parser.add_argument("--directory", type=str, help="Path to directory with JSON files")
    parser.add_argument("--sample", action="store_true", help="Ingest sample data")
    
    args = parser.parse_args()
    
    # Create database session
    db = SessionLocal()
    
    try:
        if args.sample:
            # Ingest sample data
            sample_file = Path(__file__).parent.parent / "data" / "sample_programs.json"
            if not sample_file.exists():
                logger.error(f"Sample file not found: {sample_file}")
                return
            ingest_file(sample_file, db)
        
        elif args.file:
            file_path = Path(args.file)
            if not file_path.exists():
                logger.error(f"File not found: {file_path}")
                return
            ingest_file(file_path, db)
        
        elif args.directory:
            dir_path = Path(args.directory)
            if not dir_path.is_dir():
                logger.error(f"Directory not found: {dir_path}")
                return
            ingest_directory(dir_path, db)
        
        else:
            parser.print_help()
            logger.error("Please specify --file, --directory, or --sample")
    
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        raise
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
