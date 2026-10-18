"""Application configuration loaded from environment variables."""
from functools import lru_cache
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "SIRA API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/sira"
    
    # Clerk Authentication
    clerk_jwks_url: str | None = None
    clerk_frontend_api: str | None = None
    clerk_secret_key: str | None = None
    
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Pinecone Configuration
    pinecone_api_key: str | None = None
    pinecone_environment: str | None = None
    pinecone_index_name: str = "sira-academic-programs"
    
    # AI Provider Selection ("mistral", "deepseek", "gemini")
    llm_provider: str = "mistral"
    embedding_provider: str = "mistral"
    embedding_dimension: int | None = None
    
    # Mistral AI Configuration
    mistral_api_key: str | None = None
    mistral_embedding_model: str = "mistral-embed"
    mistral_llm_model: str = "mistral-large-latest"
    
    # DeepSeek Configuration
    deepseek_api_key: str | None = None
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_llm_model: str = "deepseek-chat"
    deepseek_embedding_model: str = "deepseek-embed"
    deepseek_embedding_base_url: str | None = None
    deepseek_embedding_dimension: int = 1536
    
    # Google Gemini Configuration
    gemini_api_key: str | None = None
    gemini_llm_model: str = "gemini-3.8-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    gemini_embedding_dimension: int = 1024
    
    # RAG Configuration
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_results: int = 5
    
    # Security
    secret_key: str | None = None
    jwt_secret: str | None = None
    
    # File Upload Configuration
    upload_dir: str = "./uploads"
    max_upload_size: int = 5242880  # 5MB
    allowed_upload_types: str = "pdf,jpg,jpeg,png"
    
    @field_validator(
        "gemini_llm_model",
        "gemini_embedding_model",
        "deepseek_llm_model",
        "deepseek_embedding_model",
        "mistral_llm_model",
        "mistral_embedding_model",
        "llm_provider",
        "embedding_provider",
        mode="before",
    )
    @classmethod
    def empty_str_to_default(cls, v, info):
        if not v or (isinstance(v, str) and not v.strip()):
            return cls.model_fields[info.field_name].default
        return v.strip()

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }



@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
