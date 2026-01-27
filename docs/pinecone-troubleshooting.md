# Pinecone Troubleshooting Guide

## Error: DNS Resolution Failed for Pinecone

If you see errors like:
```
Failed to resolve 'sira-academic-programs-xxxx.svc.aped-xxxx.pinecone.io'
```

### Solution:

1. **Check Environment Variable Names**
   - Ensure your `.env` file uses `PINECONE_INDEX_NAME` (not `PINECONE_INDEX`)
   - Verify with: `docker exec sira_backend env | grep PINECONE`

2. **Verify Pinecone Credentials**
   ```bash
   docker exec sira_backend python test_pinecone_connection.py
   ```

3. **Check if Index Exists**
   - The index must exist in your Pinecone account
   - Create it using: `docker exec sira_backend python app/ingest_sample.py`
   - Or use Pinecone dashboard to create it manually

4. **Restart Backend After Config Changes**
   ```bash
   docker-compose restart backend
   ```

## Required Environment Variables

```env
PINECONE_API_KEY=pcsk_xxxxx...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=sira-academic-programs
```

## Quick Test

Run this from the project root:
```bash
# Test connection
docker exec sira_backend python test_pinecone_connection.py

# If index doesn't exist, create and populate it
docker exec sira_backend python app/ingest_sample.py
```

## Common Issues

1. **Index doesn't exist**: Create it or update `PINECONE_INDEX_NAME` to an existing index
2. **Wrong API key**: Check your Pinecone dashboard for the correct key
3. **Network issues**: Docker containers should have internet access to reach Pinecone cloud
4. **Empty index**: Run `app/ingest_sample.py` to populate with sample data
