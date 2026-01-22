"""
Test semantic search functionality for SIRA.

This script demonstrates how to query the Pinecone vector database
with various student queries and metadata filters.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.core.vector_db import get_pinecone_manager
from app.core.config import get_settings

settings = get_settings()


def print_results(query: str, results: list, filters: dict = None):
    """Pretty print search results."""
    print(f"\n{'='*80}")
    print(f"Query: {query}")
    if filters:
        print(f"Filters: {filters}")
    print(f"{'='*80}\n")
    
    if not results:
        print("❌ No results found\n")
        return
    
    for i, result in enumerate(results, 1):
        metadata = result.get("metadata", {})
        score = result.get("score", 0)
        
        print(f"Result {i} (Score: {score:.4f}):")
        print(f"  🏛️  University: {metadata.get('university', 'N/A')}")
        print(f"  📚 Program: {metadata.get('program_name', 'N/A')}")
        print(f"  🎓 Degree: {metadata.get('degree_type', 'N/A')}")
        print(f"  📍 Location: {metadata.get('location', 'N/A')}")
        print(f"  💰 Tuition: {metadata.get('tuition_fee_mad', 'N/A')} MAD/year")
        print(f"  🗣️  Language: {metadata.get('language', 'N/A')}")
        
        if 'min_gpa' in metadata:
            print(f"  📊 Min GPA: {metadata['min_gpa']}/20")
        
        print()


def main():
    """Run test queries."""
    print("\n🔍 SIRA Semantic Search Tests")
    print("=" * 80)
    
    # Initialize Pinecone manager
    try:
        manager = get_pinecone_manager()
        stats = manager.get_index_stats()
        print(f"\n✅ Connected to Pinecone")
        print(f"   Index: {settings.pinecone_index_name}")
        print(f"   Total vectors: {stats['total_vectors']}")
    except Exception as e:
        print(f"\n❌ Failed to connect to Pinecone: {e}")
        return
    
    # Test 1: General computer science search
    print("\n\n TEST 1: General Computer Science Programs")
    print("-" * 80)
    results = manager.query(
        query_text="I want to study computer science and software engineering",
        top_k=3
    )
    print_results(
        "I want to study computer science and software engineering",
        results
    )
    
    # Test 2: Budget-constrained search
    print("\n\n TEST 2: Affordable Programs (< 50,000 MAD)")
    print("-" * 80)
    results = manager.query(
        query_text="Computer science or engineering programs",
        filters={"tuition_fee_mad": {"$lt": 50000}},
        top_k=3
    )
    print_results(
        "Computer science or engineering programs",
        results,
        {"tuition_fee_mad": {"$lt": 50000}}
    )
    
    # Test 3: English language programs
    print("\n\n TEST 3: English-taught Programs")
    print("-" * 80)
    results = manager.query(
        query_text="I want to study technology and innovation",
        filters={"language": "English"},
        top_k=3
    )
    print_results(
        "I want to study technology and innovation",
        results,
        {"language": "English"}
    )
    
    # Test 4: Data science and AI
    print("\n\n TEST 4: Data Science & AI Specialization")
    print("-" * 80)
    results = manager.query(
        query_text="I'm interested in artificial intelligence, machine learning, and data science",
        top_k=3
    )
    print_results(
        "I'm interested in artificial intelligence, machine learning, and data science",
        results
    )
    
    # Test 5: Cybersecurity
    print("\n\n TEST 5: Cybersecurity Focus")
    print("-" * 80)
    results = manager.query(
        query_text="I want to become a cybersecurity expert and ethical hacker",
        top_k=2
    )
    print_results(
        "I want to become a cybersecurity expert and ethical hacker",
        results
    )
    
    # Test 6: Budget and GPA filters combined
    print("\n\n TEST 6: Affordable + Accessible (GPA <= 13)")
    print("-" * 80)
    results = manager.query(
        query_text="Computer science or IT programs",
        filters={
            "tuition_fee_mad": {"$lt": 80000},
            "min_gpa": {"$lte": 13.0}
        },
        top_k=3
    )
    print_results(
        "Computer science or IT programs",
        results,
        {"tuition_fee_mad": {"$lt": 80000}, "min_gpa": {"$lte": 13.0}}
    )
    
    print("\n" + "=" * 80)
    print("✅ All tests completed!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
