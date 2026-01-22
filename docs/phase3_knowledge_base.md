# Phase 3: Knowledge Base & Data Ingestion

## Overview

This phase implements the RAG (Retrieval-Augmented Generation) infrastructure for SIRA using:
- **Pinecone** for vector storage
- **Mistral AI** for embeddings
- **LlamaIndex** for document processing and indexing

## Setup

### 1. Environment Variables

Add to `backend/.env`:

```bash
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1  # or your region
PINECONE_INDEX_NAME=sira-academic-programs

# Mistral AI Configuration
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_EMBEDDING_MODEL=mistral-embed
MISTRAL_LLM_MODEL=mistral-large-latest

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `pinecone-client==5.0.1`
- `llama-index==0.12.7`
- `llama-index-vector-stores-pinecone==0.4.0`
- `llama-index-embeddings-mistralai==0.3.0`
- `mistralai==1.2.4`

### 3. Database Migration

The `documents` table has been created to track ingested data:

```bash
cd backend
alembic upgrade head
```

## Data Schema

Academic programs follow this JSON structure (see `data/program_template.json`):

```json
{
  "university": "University Name",
  "program_name": "Program Title",
  "degree_type": "Bachelor/Master/Engineering",
  "duration_years": 3,
  "tuition_fee_mad": 80000,
  "location": "City, Country",
  "field": "Engineering and Technology",
  "subfield": "Computer Science",
  "language_of_instruction": "English/French",
  "requirements": {
    "min_gpa": 14.0,
    "required_subjects": ["Math", "Physics"]
  },
  "description": "Program description...",
  "career_paths": ["Job 1", "Job 2"],
  ...
}
```

## Sample Data

10 Moroccan university programs included in `data/sample_programs.json`:
1. UM6P - Computer Science (Bachelor)
2. Al Akhawayn - Computer Science (Bachelor)
3. EMI - Computer Engineering (Engineering)
4. ENSIAS - Software Engineering (Engineering)
5. INPT - Telecommunications (Engineering)
6. ENSET - Web Development (Bachelor)
7. UIR - Data Science & AI (Bachelor)
8. HEM - Digital Marketing (Bachelor)
9. ENSA Marrakech - Computer Science (Engineering)
10. Mundiapolis - Cybersecurity (Bachelor)

## Data Ingestion

### Ingest Sample Data

```bash
cd scripts
python ingest_data.py --sample
```

### Ingest Custom File

```bash
python ingest_data.py --file /path/to/programs.json
```

### Ingest Directory

```bash
python ingest_data.py --directory /path/to/data/
```

## How It Works

1. **Loading**: JSON files are parsed into program dictionaries
2. **Text Conversion**: Programs are converted to structured text
3. **Document Creation**: LlamaIndex `Document` objects with metadata
4. **Chunking**: Text split into 1000-token chunks (200 overlap)
5. **Embedding**: Mistral embeddings generated for each chunk
6. **Indexing**: Vectors stored in Pinecone with metadata
7. **Database Tracking**: Records saved to PostgreSQL `documents` table

## Vector Database Structure

Each vector in Pinecone includes:

**Vector**: 1024-dimensional embedding (Mistral)

**Metadata**:
- `university`: University name
- `program_name`: Program title
- `degree_type`: Bachelor/Master/etc
- `field`: Academic field
- `location`: City/country
- `tuition_fee_mad`: Annual cost (MAD)
- `language`: Instruction language
- `min_gpa`: Minimum GPA requirement
- `admission_rate`: Admission percentage

## Querying

The Pinecone manager supports semantic search with metadata filtering:

```python
from backend.app.core.vector_db import get_pinecone_manager

manager = get_pinecone_manager()

# Semantic search
results = manager.query(
    query_text="Computer science programs in Morocco under 50000 MAD",
    filters={"tuition_fee_mad": {"$lt": 50000}},
    top_k=5
)
```

## Database Table: `documents`

Tracks all ingested documents:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source_file | VARCHAR(500) | Original filename |
| document_type | VARCHAR(100) | Type (program_catalog, etc) |
| university | VARCHAR(255) | University name |
| program_name | VARCHAR(255) | Program title |
| ingestion_date | TIMESTAMP | When ingested |
| status | VARCHAR(50) | active/archived/error |
| document_metadata | JSONB | Full program JSON |
| content_preview | TEXT | First 500 chars |
| vector_count | VARCHAR(50) | Number of vectors |

## Next Steps (Phase 4)

- Build recommendation engine using RAG
- Implement query construction from student profiles
- Create LLM prompt templates
- Add streaming responses
- Build recommendation API endpoints

## Troubleshooting

### Pinecone Connection Error
Ensure `PINECONE_API_KEY` and `PINECONE_ENVIRONMENT` are set correctly.

### Mistral API Error
Check `MISTRAL_API_KEY` is valid and has sufficient credits.

### Import Errors
Restart the backend container after installing new dependencies:
```bash
docker-compose restart backend
```

### Database Migration Issues
If migrations fail, manually create the table:
```sql
-- See alembic/versions/001_documents.py for SQL
```

## Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- [Mistral AI Documentation](https://docs.mistral.ai/)
