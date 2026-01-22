"""Test Pinecone ingestion with direct approach."""
import sys
sys.path.insert(0, '/app')

from llama_index.core import Document, VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.mistralai import MistralAIEmbedding
from llama_index.core import Settings
from app.core.vector_db import get_pinecone_manager
from app.core.config import get_settings

settings = get_settings()

# Configure global settings
Settings.embed_model = MistralAIEmbedding(
    api_key=settings.mistral_api_key,
    model_name=settings.mistral_embedding_model
)

print("Creating test documents...")
documents = [
    Document(
        text="UM6P offers a Computer Science Bachelor's degree in Benguerir with 80000 MAD tuition",
        metadata={"university": "UM6P", "tuition_fee_mad": 80000}
    ),
    Document(
        text="Al Akhawayn University has an English-taught CS program in Ifrane for 95000 MAD",
        metadata={"university": "Al Akhawayn", "tuition_fee_mad": 95000}
    ),
]

print("Getting Pinecone vector store...")
manager = get_pinecone_manager()
vector_store = manager.get_vector_store()

print("Creating storage context...")
storage_context = StorageContext.from_defaults(vector_store=vector_store)

print("Creating index and uploading to Pinecone...")
index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context,
    show_progress=True
)

print("\nWaiting for indexing...")
import time
time.sleep(3)

print("\nChecking Pinecone stats...")
stats = manager.get_index_stats()
print(f"✅ Total vectors: {stats['total_vectors']}")

if stats['total_vectors'] > 0:
    print("\n✅ SUCCESS! Vectors are in Pinecone")
    print("\nTesting query...")
    results = manager.query("Computer science programs under 90000 MAD", top_k=2)
    for i, result in enumerate(results, 1):
        print(f"\n{i}. Score: {result['score']:.4f}")
        print(f"   University: {result['metadata'].get('university')}")
else:
    print("\n❌ Vectors not found in Pinecone")
