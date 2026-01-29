"""FastAPI entrypoint for SIRA backend."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, users, profiles, upload, recommendations, conversations, admin
from app.db import init_db
from app.core.config import get_settings
from app.core.env_validation import validate_environment, log_startup_info
from app.core.exception_handlers import register_exception_handlers
from app.middleware.logging_middleware import LoggingMiddleware, ErrorLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    
    # Validate environment configuration on startup
    log_startup_info()
    
    try:
        validate_environment()
    except Exception as e:
        logger.error(f"Environment validation failed: {e}")
        raise
    
    app = FastAPI(
        title=settings.app_name,
        description="SIRA - Student Intelligent Recommendation Advisor",
        version="1.0.0",
    )

    @app.on_event("startup")
    def on_startup() -> None:
        logger.info("Initializing database connection...")
        init_db()
        logger.info("Database initialized successfully")

    # Register exception handlers for consistent error responses
    register_exception_handlers(app)

    # Add security headers middleware
    app.add_middleware(
        SecurityHeadersMiddleware,
        enable_csp=True,
        environment=settings.environment,
    )

    # Add rate limiting middleware (before logging to avoid logging rate-limited requests)
    # Development: 120 req/min, 2000 req/hour
    # Production: Consider lowering or using Redis-backed rate limiting
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=120,
        requests_per_hour=2000,
        exclude_paths=["/health", "/", "/docs", "/openapi.json", "/redoc"],
    )

    # Add logging middleware
    app.add_middleware(ErrorLoggingMiddleware)
    app.add_middleware(LoggingMiddleware)
    
    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "X-RateLimit-Limit-Minute",
            "X-RateLimit-Remaining-Minute",
            "X-RateLimit-Limit-Hour",
            "X-RateLimit-Remaining-Hour",
        ],
    )

    # Register routers
    app.include_router(health.router)
    app.include_router(users.router, prefix="/api")
    app.include_router(profiles.router, prefix="/api")
    app.include_router(upload.router, prefix="/api")
    app.include_router(recommendations.router, prefix="/api")
    app.include_router(conversations.router)
    app.include_router(admin.router)

    @app.get("/")
    async def root() -> dict[str, str]:
        return {"service": settings.app_name, "status": "ok", "version": "1.0.0"}

    logger.info(f"✓ {settings.app_name} initialized successfully")
    
    return app


app = create_app()

