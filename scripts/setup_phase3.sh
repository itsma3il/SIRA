#!/bin/bash

# SIRA Phase 3 - Knowledge Base Setup Script
# This script helps set up and test the RAG infrastructure

set -e

echo "🚀 SIRA Phase 3: Knowledge Base Setup"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found${NC}"
    echo "Please copy .env.example and configure your API keys:"
    echo "  cp .env.example backend/.env"
    echo ""
    echo "Required variables:"
    echo "  - PINECONE_API_KEY"
    echo "  - MISTRAL_API_KEY"
    exit 1
fi

# Check if Pinecone API key is set
if ! grep -q "PINECONE_API_KEY=.*[a-zA-Z0-9]" backend/.env; then
    echo -e "${YELLOW}⚠️  Warning: PINECONE_API_KEY not set in backend/.env${NC}"
    echo "Get your API key from: https://www.pinecone.io/"
fi

# Check if Mistral API key is set
if ! grep -q "MISTRAL_API_KEY=.*[a-zA-Z0-9]" backend/.env; then
    echo -e "${YELLOW}⚠️  Warning: MISTRAL_API_KEY not set in backend/.env${NC}"
    echo "Get your API key from: https://console.mistral.ai/"
fi

echo ""
echo "Step 1: Installing Python dependencies..."
echo "-----------------------------------------"
docker-compose exec backend pip install -q pinecone-client llama-index llama-index-vector-stores-pinecone llama-index-embeddings-mistralai mistralai
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""
echo "Step 2: Running database migrations..."
echo "---------------------------------------"
docker-compose exec backend alembic upgrade head
echo -e "${GREEN}✅ Database migrated${NC}"

echo ""
echo "Step 3: Checking Pinecone connection..."
echo "----------------------------------------"
docker-compose exec backend python -c "
import sys
sys.path.insert(0, '/app')
try:
    from app.core.vector_db import get_pinecone_manager
    manager = get_pinecone_manager()
    manager.create_index_if_not_exists()
    stats = manager.get_index_stats()
    print(f'✅ Pinecone connected successfully')
    print(f'   Index: {manager.index_name}')
    print(f'   Total vectors: {stats[\"total_vectors\"]}')
except Exception as e:
    print(f'❌ Pinecone connection failed: {e}')
    sys.exit(1)
"

echo ""
echo "Step 4: Ingesting sample data..."
echo "---------------------------------"
echo "Ingesting 10 Moroccan university programs..."
docker-compose exec backend python /app/../scripts/ingest_data.py --sample

echo ""
echo -e "${GREEN}✅ Phase 3 setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify data ingestion:"
echo "     docker-compose exec db psql -U postgres -d sira -c 'SELECT university, program_name FROM documents;'"
echo ""
echo "  2. Test semantic search:"
echo "     docker-compose exec backend python scripts/test_search.py"
echo ""
echo "  3. View Pinecone dashboard: https://app.pinecone.io/"
echo ""
echo "For more information, see: docs/phase3_knowledge_base.md"
