"""Simple semantic search tests."""
import sys
sys.path.insert(0, '/app')

from app.core.vector_db import get_pinecone_manager

manager = get_pinecone_manager()

print("🔍 SIRA Semantic Search Tests")
print("=" * 70)

# Test 1: Computer science query
print("\n TEST 1: Computer Science Programs")
print("-" * 70)
results = manager.query("I want to study computer science and programming", top_k=3)
for i, result in enumerate(results, 1):
    meta = result['metadata']
    print(f"\n{i}. Score: {result['score']:.4f}")
    print(f"   🏛️  {meta.get('university', 'N/A')}")
    print(f"   📚 {meta.get('program_name', 'N/A')}")
    print(f"   💰 {meta.get('tuition_fee_mad', 'N/A')} MAD/year")
    print(f"   🗣️  {meta.get('language', 'N/A')}")

# Test 2: Affordable programs
print("\n\n TEST 2: Affordable Programs (< 50,000 MAD)")
print("-" * 70)
results = manager.query(
    "Engineering programs",
    filters={"tuition_fee_mad": {"$lt": 50000}},
    top_k=2
)
for i, result in enumerate(results, 1):
    meta = result['metadata']
    print(f"\n{i}. Score: {result['score']:.4f}")
    print(f"   🏛️  {meta.get('university', 'N/A')}")
    print(f"   💰 {meta.get('tuition_fee_mad', 'N/A')} MAD/year")

# Test 3: English programs
print("\n\n TEST 3: English-taught Programs")
print("-" * 70)
results = manager.query(
    "Technology and innovation",
    filters={"language": "English"},
    top_k=3
)
for i, result in enumerate(results, 1):
    meta = result['metadata']
    print(f"\n{i}. Score: {result['score']:.4f}")
    print(f"   🏛️  {meta.get('university', 'N/A')}")
    print(f"   📚 {meta.get('program_name', 'N/A')}")

# Test 4: Data science/AI
print("\n\n TEST 4: Data Science & AI")
print("-" * 70)
results = manager.query(
    "I'm interested in artificial intelligence, machine learning, and data analytics",
    top_k=2
)
for i, result in enumerate(results, 1):
    meta = result['metadata']
    print(f"\n{i}. Score: {result['score']:.4f}")
    print(f"   🏛️  {meta.get('university', 'N/A')}")
    print(f"   📚 {meta.get('program_name', 'N/A')}")

print("\n" + "=" * 70)
print("✅ All search tests completed!")
print("=" * 70)
