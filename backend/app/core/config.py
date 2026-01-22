"""Application configuration loaded from environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "SIRA API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/sira"
    
    # Clerk Authentication
    clerk_jwks_url: str | None = None
    clerk_frontend_api: str | None = None
    
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Pinecone Configuration
    pinecone_api_key: str | None = None
    pinecone_environment: str | None = None
    pinecone_index_name: str = "sira-academic-programs"
    
    # Mistral AI Configuration
    mistral_api_key: str | None = None
    mistral_embedding_model: str = "mistral-embed"
    mistral_llm_model: str = "mistral-large-latest"
    
    # RAG Configuration
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_results: int = 5

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
