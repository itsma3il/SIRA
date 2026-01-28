#!/usr/bin/env python3
"""Quick test to verify Pinecone connectivity."""
import os
import sys
from pinecone import Pinecone

def test_connection():
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "sira-academic-programs")
    
    print(f"Testing Pinecone connection...")
    print(f"API Key: {api_key[:20]}..." if api_key else "API Key: NOT SET")
    print(f"Index Name: {index_name}")
    
    if not api_key:
        print("❌ PINECONE_API_KEY not set")
        return False
    
    try:
        # Initialize Pinecone
        pc = Pinecone(api_key=api_key)
        
        # List indexes
        print("\nListing indexes...")
        indexes = pc.list_indexes()
        print(f"Available indexes: {[idx.name for idx in indexes]}")
        
        # Check if our index exists
        if index_name not in [idx.name for idx in indexes]:
            print(f"\n❌ Index '{index_name}' does not exist!")
            print("You need to create the index first or use an existing one.")
            print("\nAvailable options:")
            print("1. Create the index using: python app/ingest_sample.py")
            print("2. Or update PINECONE_INDEX_NAME to an existing index")
            return False
        
        # Get index details
        print(f"\n✅ Index '{index_name}' exists!")
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print(f"Index stats: {stats}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error connecting to Pinecone: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
