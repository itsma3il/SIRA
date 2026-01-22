# 🚀 SIRA Phase 3 - Quick Reference

## Essential Commands

### Setup & Verification
```bash
# Initial setup
./scripts/setup_phase3.sh

# Verify installation
docker-compose exec backend python /app/../scripts/verify_phase3.py
```

### Data Ingestion
```bash
# Ingest sample data (10 Moroccan universities)
docker-compose exec backend python /app/../scripts/ingest_data.py --sample

# Ingest custom JSON file
docker-compose exec backend python /app/../scripts/ingest_data.py --file /path/to/data.json

# Ingest entire directory
docker-compose exec backend python /app/../scripts/ingest_data.py --directory /path/to/data/
```

### Testing
```bash
# Run semantic search tests
docker-compose exec backend python /app/../scripts/test_search.py

# Check database records
docker-compose exec db psql -U postgres -d sira -c "SELECT university, program_name FROM documents;"

# View Pinecone stats
docker-compose exec backend python -c "
from app.core.vector_db import get_pinecone_manager
manager = get_pinecone_manager()
print(manager.get_index_stats())
"
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Check migration status
docker-compose exec backend alembic current

# View documents table
docker-compose exec db psql -U postgres -d sira -c "\d documents"
```

## Environment Variables (Required)

```bash
# Pinecone
PINECONE_API_KEY=pk-xxxxx
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=sira-academic-programs

# Mistral AI
MISTRAL_API_KEY=xxxxx
MISTRAL_EMBEDDING_MODEL=mistral-embed
MISTRAL_LLM_MODEL=mistral-large-latest

# RAG Config (optional, defaults shown)
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
```

## Python API Usage

### Query Vector Database
```python
from backend.app.core.vector_db import get_pinecone_manager

manager = get_pinecone_manager()

# Basic semantic search
results = manager.query(
    query_text="Computer science programs in Morocco",
    top_k=5
)

# With metadata filters
results = manager.query(
    query_text="Engineering programs",
    filters={
        "tuition_fee_mad": {"$lt": 50000},
        "min_gpa": {"$lte": 14.0}
    },
    top_k=3
)

# Complex filters
results = manager.query(
    query_text="Technology programs",
    filters={
        "language": "English",
        "field": "Engineering and Technology",
        "tuition_fee_mad": {"$lt": 90000}
    },
    top_k=5
)
```

### Get Index Statistics
```python
manager = get_pinecone_manager()
stats = manager.get_index_stats()

print(f"Total vectors: {stats['total_vectors']}")
print(f"Dimension: {stats['dimension']}")
print(f"Index fullness: {stats['index_fullness']}")
```

### Delete Vectors
```python
# Delete by metadata filter
manager.delete_by_metadata({"university": "UM6P"})

# Delete by source file
manager.delete_by_metadata({"source": "old_data.json"})
```

## Pinecone Metadata Filters

| Field | Type | Operators | Example |
|-------|------|-----------|---------|
| `tuition_fee_mad` | number | `$lt`, `$lte`, `$gt`, `$gte`, `$eq` | `{"$lt": 50000}` |
| `min_gpa` | number | `$lt`, `$lte`, `$gt`, `$gte`, `$eq` | `{"$lte": 14.0}` |
| `admission_rate` | number | `$lt`, `$lte`, `$gt`, `$gte`, `$eq` | `{"$lt": 20}` |
| `university` | string | `$eq`, `$in` | `{"$eq": "UM6P"}` |
| `language` | string | `$eq`, `$in` | `{"$eq": "English"}` |
| `degree_type` | string | `$eq`, `$in` | `{"$in": ["Bachelor", "Master"]}` |
| `field` | string | `$eq`, `$in` | `{"$eq": "Engineering and Technology"}` |
| `location` | string | `$eq`, `$in` | `{"$in": ["Rabat, Morocco", "Casablanca, Morocco"]}` |

## File Locations

```
📁 Configuration
  └── backend/app/core/config.py          # Settings
  └── backend/app/core/vector_db.py       # Pinecone manager
  └── .env.example                        # Template

📁 Models & Database
  └── backend/app/models/document.py      # Document model
  └── backend/alembic/versions/           # Migrations

📁 Data
  └── data/program_template.json          # Schema template
  └── data/sample_programs.json           # 10 sample programs

📁 Scripts
  └── scripts/ingest_data.py              # Data ingestion
  └── scripts/test_search.py              # Search testing
  └── scripts/verify_phase3.py            # Setup verification
  └── scripts/setup_phase3.sh             # Automated setup

📁 Documentation
  └── docs/phase3_knowledge_base.md       # Full documentation
  └── docs/PHASE3_SUMMARY.md              # Completion report
```

## Common Issues & Solutions

### "Can't load plugin: sqlalchemy.dialects:driver"
**Solution**: Fixed in alembic/env.py by using direct engine creation

### "relation 'documents' already exists"
**Solution**: 
```bash
docker-compose exec backend alembic stamp head
```

### "Attribute name 'metadata' is reserved"
**Solution**: Column renamed to `document_metadata`

### Missing API keys
**Solution**: 
1. Get keys from Pinecone & Mistral AI
2. Add to `backend/.env`
3. Restart backend: `docker-compose restart backend`

### Import errors after adding dependencies
**Solution**:
```bash
docker-compose exec backend pip install -r requirements.txt
docker-compose restart backend
```

## Next Steps (Phase 4)

1. Build query construction from student profiles
2. Implement RAG retrieval with re-ranking
3. Create LLM prompt templates
4. Integrate Mistral AI for generation
5. Add streaming responses
6. Create `/api/recommendations` endpoints

## Resources

- 📖 [Phase 3 Full Docs](../docs/phase3_knowledge_base.md)
- 📊 [Phase 3 Summary](../docs/PHASE3_SUMMARY.md)
- 📋 [Development Plan](../.planning/detailed_development_plan.md)
- 🔗 [Pinecone Docs](https://docs.pinecone.io/)
- 🔗 [LlamaIndex Docs](https://docs.llamaindex.ai/)
- 🔗 [Mistral AI Docs](https://docs.mistral.ai/)

---

**Phase 3 Status**: ✅ **COMPLETE**  
**Ready for**: Phase 4 - AI Recommendation Engine
