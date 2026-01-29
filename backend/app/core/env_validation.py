"""Environment configuration validation at startup."""
import logging
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when required configuration is missing or invalid."""
    pass


def validate_environment() -> None:
    """
    Validate all required environment variables are set.
    
    Raises:
        ConfigurationError: If required configuration is missing
    """
    settings = get_settings()
    errors: list[str] = []
    
    # Critical settings that must be present
    critical_settings = {
        "database_url": settings.database_url,
        "clerk_jwks_url": settings.clerk_jwks_url,
        "mistral_api_key": settings.mistral_api_key,
        "pinecone_api_key": settings.pinecone_api_key,
    }
    
    for setting_name, setting_value in critical_settings.items():
        if not setting_value:
            errors.append(f"Missing required setting: {setting_name}")
    
    # Validate database URL format
    if settings.database_url and not settings.database_url.startswith("postgresql"):
        errors.append("database_url must be a PostgreSQL connection string")
    
    # Validate CORS origins
    if not settings.cors_origins:
        logger.warning("No CORS origins configured - API will reject all cross-origin requests")
    
    # Validate environment
    valid_environments = ["development", "staging", "production"]
    if settings.environment not in valid_environments:
        errors.append(
            f"Invalid environment '{settings.environment}'. "
            f"Must be one of: {', '.join(valid_environments)}"
        )
    
    # Production-specific validations
    if settings.environment == "production":
        if not settings.clerk_frontend_api:
            logger.warning(
                "clerk_frontend_api not set in production - JWT audience validation disabled"
            )
        
        # Check CORS is not wildcard in production
        if "*" in settings.cors_origins:
            errors.append("CORS origins cannot include wildcard (*) in production")
    
    # Log configuration summary
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"App Name: {settings.app_name}")
    logger.info(f"CORS Origins: {settings.cors_origins}")
    logger.info(f"Pinecone Index: {settings.pinecone_index_name}")
    logger.info(f"Mistral LLM Model: {settings.mistral_llm_model}")
    logger.info(f"RAG Top-K: {settings.top_k_results}")
    
    # Raise error if any critical settings are missing
    if errors:
        error_message = "Configuration validation failed:\n" + "\n".join(f"  - {err}" for err in errors)
        logger.error(error_message)
        raise ConfigurationError(error_message)
    
    logger.info("✓ Environment configuration validated successfully")


def log_startup_info() -> None:
    """Log important startup information."""
    settings = get_settings()
    
    logger.info("=" * 60)
    logger.info("SIRA Backend Starting")
    logger.info("=" * 60)
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Database: {'✓ Configured' if settings.database_url else '✗ Missing'}")
    logger.info(f"Clerk Auth: {'✓ Configured' if settings.clerk_jwks_url else '✗ Missing'}")
    logger.info(f"Mistral AI: {'✓ Configured' if settings.mistral_api_key else '✗ Missing'}")
    logger.info(f"Pinecone: {'✓ Configured' if settings.pinecone_api_key else '✗ Missing'}")
    logger.info("=" * 60)
