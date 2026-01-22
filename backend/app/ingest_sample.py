"""Simple ingestion script for sample data - runs inside container."""
import json
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, '/app')

from llama_index.core import Document, StorageContext
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core import Settings
from llama_index.core import VectorStoreIndex
from app.core.vector_db import get_pinecone_manager
from app.core.config import get_settings
from app.db import session_scope
from app.models.document import Document as DBDocument

settings = get_settings()

# Configure LlamaIndex global settings
Settings.embed_model = get_pinecone_manager().embedding_model

# Sample data embedded in script
SAMPLE_PROGRAMS = [
    {
        "university": "Mohammed VI Polytechnic University (UM6P)",
        "program_name": "Bachelor of Science in Computer Science",
        "degree_type": "Bachelor",
        "duration_years": 3,
        "tuition_fee_mad": 80000,
        "location": "Benguerir, Morocco",
        "field": "Engineering and Technology",
        "subfield": "Computer Science",
        "language_of_instruction": "English",
        "requirements": {"min_gpa": 14.0, "required_subjects": ["Mathematics", "Physics"]},
        "description": "Comprehensive training in software development, algorithms, AI, and cybersecurity with modern facilities and industry partnerships.",
        "career_paths": ["Software Engineer", "Data Scientist", "AI/ML Engineer", "Cybersecurity Analyst"],
        "admission_rate_percentage": 25,
        "scholarships_available": True
    },
    {
        "university": "Al Akhawayn University",
        "program_name": "Bachelor of Science in Computer Science",
        "degree_type": "Bachelor",
        "duration_years": 4,
        "tuition_fee_mad": 95000,
        "location": "Ifrane, Morocco",
        "field": "Engineering and Technology",
        "subfield": "Computer Science",
        "language_of_instruction": "English",
        "requirements": {"min_gpa": 13.0, "required_subjects": ["Mathematics"]},
        "description": "American-style liberal arts computer science program with ABET accreditation and strong industry connections.",
        "career_paths": ["Software Developer", "Systems Analyst", "Database Administrator"],
        "admission_rate_percentage": 40,
        "scholarships_available": True
    },
    {
        "university": "École Mohammadia d'Ingénieurs (EMI)",
        "program_name": "Diplôme d'Ingénieur en Génie Informatique",
        "degree_type": "Engineering",
        "duration_years": 5,
        "tuition_fee_mad": 5000,
        "location": "Rabat, Morocco",
        "field": "Engineering and Technology",
        "subfield": "Computer Engineering",
        "language_of_instruction": "French",
        "requirements": {"min_gpa": 16.0, "required_subjects": ["Mathematics", "Physics", "Chemistry"]},
        "description": "Prestigious public engineering school with rigorous curriculum and highly competitive admission based on national exam.",
        "career_paths": ["Systems Engineer", "Network Architect", "Research Engineer"],
        "admission_rate_percentage": 5,
        "scholarships_available": False
    },
    {
        "university": "ENSIAS",
        "program_name": "Diplôme d'Ingénieur en Génie Logiciel",
        "degree_type": "Engineering",
        "duration_years": 5,
        "tuition_fee_mad": 3000,
        "location": "Rabat, Morocco",
        "field": "Engineering and Technology",
        "subfield": "Software Engineering",
        "language_of_instruction": "French",
        "requirements": {"min_gpa": 15.5, "required_subjects": ["Mathematics", "Physics"]},
        "description": "National school specializing in software engineering with focus on architecture, project management, and quality assurance.",
        "career_paths": ["Software Architect", "DevOps Engineer", "Scrum Master"],
        "admission_rate_percentage": 8,
        "scholarships_available": False
    },
    {
        "university": "Université Internationale de Rabat (UIR)",
        "program_name": "Bachelor in Data Science and AI",
        "degree_type": "Bachelor",
        "duration_years": 3,
        "tuition_fee_mad": 75000,
        "location": "Rabat, Morocco",
        "field": "Data Science and AI",
        "subfield": "Artificial Intelligence",
        "language_of_instruction": "English",
        "requirements": {"min_gpa": 13.5, "required_subjects": ["Mathematics", "Computer Science"]},
        "description": "Modern data science program covering machine learning, deep learning, big data, and AI ethics with industry collaboration.",
        "career_paths": ["Data Analyst", "Machine Learning Engineer", "AI Researcher"],
        "admission_rate_percentage": 35,
        "scholarships_available": True
    }
]


def program_to_text(program):
    """Convert program to text for embedding."""
    parts = [
        f"University: {program['university']}",
        f"Program: {program['program_name']}",
        f"Degree: {program['degree_type']}",
        f"Field: {program['field']}",
        f"Location: {program['location']}",
        f"Duration: {program['duration_years']} years",
        f"Tuition: {program['tuition_fee_mad']} MAD/year",
        f"Language: {program['language_of_instruction']}",
        f"\nRequirements:",
        f"- Min GPA: {program['requirements']['min_gpa']}/20",
        f"- Subjects: {', '.join(program['requirements']['required_subjects'])}",
        f"\nDescription: {program['description']}",
        f"\nCareer Paths: {', '.join(program['career_paths'])}",
    ]
    return "\n".join(parts)


print("🚀 SIRA Data Ingestion Starting...")
print("=" * 60)

# Initialize
manager = get_pinecone_manager()

print(f"\n1️⃣  Creating LlamaIndex documents from {len(SAMPLE_PROGRAMS)} programs...")

documents = []
for program in SAMPLE_PROGRAMS:
    text = program_to_text(program)
    metadata = {
        "university": program["university"],
        "program_name": program["program_name"],
        "degree_type": program["degree_type"],
        "field": program["field"],
        "location": program["location"],
        "tuition_fee_mad": program["tuition_fee_mad"],
        "language": program["language_of_instruction"],
        "min_gpa": float(program["requirements"]["min_gpa"]),
        "admission_rate": program["admission_rate_percentage"],
    }
    doc = Document(text=text, metadata=metadata)
    documents.append(doc)

print(f"   ✅ Created {len(documents)} documents")

print("\n2️⃣  Chunking documents...")
splitter = SentenceSplitter(chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap)
chunks = splitter.get_nodes_from_documents(documents)
print(f"   ✅ Split into {len(chunks)} chunks")

print("\n3️⃣  Indexing in Pinecone (this may take a minute)...")
try:
    vector_store = manager.get_vector_store()
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    index = VectorStoreIndex.from_documents(
        chunks,
        storage_context=storage_context,
        show_progress=True
    )
    print(f"   ✅ Successfully indexed {len(chunks)} chunks")
except Exception as e:
    print(f"   ❌ Indexing failed: {e}")
    raise

print("\n4️⃣  Saving to PostgreSQL...")
with session_scope() as db:
    for program in SAMPLE_PROGRAMS:
        text = program_to_text(program)
        preview = text[:500] + "..." if len(text) > 500 else text
        
        db_doc = DBDocument(
            source_file="sample_programs.json",
            document_type="program_catalog",
            university=program["university"],
            program_name=program["program_name"],
            ingestion_date=datetime.utcnow(),
            status="active",
            document_metadata=program,
            content_preview=preview,
            vector_count=str(len(chunks) // len(SAMPLE_PROGRAMS))
        )
        db.add(db_doc)
    
    db.commit()
    print(f"   ✅ Saved {len(SAMPLE_PROGRAMS)} records to database")

print("\n5️⃣  Verifying ingestion...")
stats = manager.get_index_stats()
print(f"   ✅ Pinecone index now has {stats['total_vectors']} vectors")

with session_scope() as db:
    db_count = db.query(DBDocument).count()
    print(f"   ✅ PostgreSQL has {db_count} document records")

print("\n" + "=" * 60)
print("✅ Ingestion complete!")
print("\nYou can now test semantic search with:")
print("   docker-compose exec backend python -c \"<search code>\"")
