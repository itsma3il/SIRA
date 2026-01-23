"""Test conversation system setup."""
import sys
import logging
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_imports():
    """Test that all conversation modules can be imported."""
    try:
        logger.info("Testing model imports...")
        from app.models.conversation import ConversationSession, ConversationMessage
        logger.info("✓ Models imported successfully")
        
        logger.info("Testing schema imports...")
        from app.schemas.conversation import (
            SessionCreate, SessionUpdate, MessageCreate,
            SessionResponse, SessionListResponse, SessionDetailResponse
        )
        logger.info("✓ Schemas imported successfully")
        
        logger.info("Testing repository imports...")
        from app.repositories import conversation_repository
        logger.info("✓ Repository imported successfully")
        
        logger.info("Testing service imports...")
        from app.services.conversation_service import ConversationService
        from app.services.conversational_ai_service import ConversationalAIService
        logger.info("✓ Services imported successfully")
        
        logger.info("Testing route imports...")
        from app.api.routes import conversations
        logger.info("✓ Routes imported successfully")
        
        logger.info("\n✅ All conversation system imports successful!")
        return True
    
    except Exception as e:
        logger.error(f"\n❌ Import test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_migration_file():
    """Check if migration file exists and is valid."""
    try:
        logger.info("\nTesting migration file...")
        migration_file = backend_dir / "alembic" / "versions" / "003_conversation_system.py"
        
        if not migration_file.exists():
            logger.error(f"❌ Migration file not found: {migration_file}")
            return False
        
        logger.info(f"✓ Migration file exists: {migration_file}")
        
        # Try to import the migration
        import importlib.util
        spec = importlib.util.spec_from_file_location("migration_003", migration_file)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Check for required functions
        if not hasattr(module, 'upgrade'):
            logger.error("❌ Migration missing upgrade() function")
            return False
        if not hasattr(module, 'downgrade'):
            logger.error("❌ Migration missing downgrade() function")
            return False
        
        logger.info("✓ Migration file is valid")
        logger.info(f"  Revision: {module.revision}")
        logger.info(f"  Down Revision: {module.down_revision}")
        logger.info("\n✅ Migration file test successful!")
        return True
    
    except Exception as e:
        logger.error(f"\n❌ Migration test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    logger.info("=" * 60)
    logger.info("CONVERSATION SYSTEM SETUP TEST")
    logger.info("=" * 60)
    
    results = []
    
    # Test imports
    results.append(("Import Test", test_imports()))
    
    # Test migration
    results.append(("Migration Test", test_migration_file()))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        logger.info("\n🎉 All tests passed! Conversation system is ready.")
        logger.info("\nNext steps:")
        logger.info("1. Run: docker-compose up -d db")
        logger.info("2. Run migration: alembic upgrade head")
        logger.info("3. Start backend: uvicorn app.main:app --reload")
        logger.info("4. Test API endpoints")
    else:
        logger.error("\n⚠️ Some tests failed. Please fix the issues above.")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
