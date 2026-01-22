"""
Quick verification script to check Phase 3 setup.
Runs basic health checks on all Phase 3 components.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

def check_imports():
    """Verify all required packages are installed."""
    print("1️⃣  Checking Python packages...")
    try:
        import pinecone
        import llama_index
        import mistralai
        print("   ✅ All packages installed")
        return True
    except ImportError as e:
        print(f"   ❌ Missing package: {e}")
        return False


def check_env_vars():
    """Verify environment variables are set."""
    print("\n2️⃣  Checking environment variables...")
    from app.core.config import get_settings
    settings = get_settings()
    
    issues = []
    if not settings.pinecone_api_key:
        issues.append("PINECONE_API_KEY not set")
    if not settings.mistral_api_key:
        issues.append("MISTRAL_API_KEY not set")
    
    if issues:
        print(f"   ⚠️  Missing: {', '.join(issues)}")
        return False
    else:
        print("   ✅ All required env vars configured")
        return True


def check_database():
    """Verify documents table exists."""
    print("\n3️⃣  Checking database...")
    try:
        from app.db import SessionLocal
        from app.models.document import Document
        
        db = SessionLocal()
        count = db.query(Document).count()
        db.close()
        
        print(f"   ✅ Documents table exists ({count} records)")
        return True
    except Exception as e:
        print(f"   ❌ Database error: {e}")
        return False


def check_pinecone():
    """Verify Pinecone connection."""
    print("\n4️⃣  Checking Pinecone connection...")
    try:
        from app.core.vector_db import get_pinecone_manager
        
        manager = get_pinecone_manager()
        stats = manager.get_index_stats()
        
        print(f"   ✅ Connected to Pinecone")
        print(f"      Index: {manager.index_name}")
        print(f"      Vectors: {stats['total_vectors']}")
        return True
    except Exception as e:
        print(f"   ❌ Pinecone error: {e}")
        return False


def check_sample_data():
    """Verify sample data exists."""
    print("\n5️⃣  Checking sample data...")
    sample_file = Path(__file__).parent.parent / "data" / "sample_programs.json"
    
    if sample_file.exists():
        import json
        with open(sample_file) as f:
            data = json.load(f)
        print(f"   ✅ Sample data found ({len(data)} programs)")
        return True
    else:
        print("   ❌ Sample data file not found")
        return False


def main():
    """Run all verification checks."""
    print("\n🔍 SIRA Phase 3 Verification")
    print("=" * 60)
    
    checks = [
        check_imports,
        check_env_vars,
        check_database,
        check_pinecone,
        check_sample_data,
    ]
    
    results = [check() for check in checks]
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All checks passed ({passed}/{total})")
        print("\n✨ Phase 3 is ready to use!")
        print("\nNext steps:")
        print("  • Ingest data: python scripts/ingest_data.py --sample")
        print("  • Test search: python scripts/test_search.py")
        print("  • Read docs: docs/phase3_knowledge_base.md")
    else:
        print(f"⚠️  Some checks failed ({passed}/{total} passed)")
        print("\nPlease fix the issues above and run again.")
        sys.exit(1)


if __name__ == "__main__":
    main()
