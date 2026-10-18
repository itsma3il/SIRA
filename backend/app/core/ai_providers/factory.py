"""Provider factory functions."""
import logging
from typing import Optional

from llama_index.core.base.embeddings.base import BaseEmbedding
from llama_index.embeddings.mistralai import MistralAIEmbedding
from llama_index.embeddings.openai import OpenAIEmbedding

from app.core.ai_providers.base import (
    BaseLLMProvider,
    EmbeddingProviderType,
    LLMProviderType,
)
from app.core.ai_providers.deepseek import DeepSeekLLMProvider
from app.core.ai_providers.gemini import GeminiEmbedding, GeminiLLMProvider
from app.core.ai_providers.mistral import MistralLLMProvider
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def get_llm_provider(provider_name: Optional[str] = None) -> BaseLLMProvider:
    """
    Factory to retrieve configured LLM provider.

    Args:
        provider_name: Optional explicit provider override.

    Returns:
        Instance of BaseLLMProvider.
    """
    settings = get_settings()
    provider = (provider_name or settings.llm_provider).lower().strip()

    if provider == LLMProviderType.MISTRAL:
        if not settings.mistral_api_key:
            raise ValueError("MISTRAL_API_KEY is not configured")
        model = (settings.mistral_llm_model or "").strip() or "mistral-large-latest"
        return MistralLLMProvider(
            api_key=settings.mistral_api_key,
            model=model,
        )

    elif provider == LLMProviderType.DEEPSEEK:
        if not settings.deepseek_api_key:
            raise ValueError("DEEPSEEK_API_KEY is not configured")
        model = (settings.deepseek_llm_model or "").strip() or "deepseek-chat"
        base_url = (settings.deepseek_base_url or "").strip() or "https://api.deepseek.com"
        return DeepSeekLLMProvider(
            api_key=settings.deepseek_api_key,
            base_url=base_url,
            model=model,
        )

    elif provider == LLMProviderType.GEMINI:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
        model = (settings.gemini_llm_model or "").strip() or "gemini-3.8-flash"
        return GeminiLLMProvider(
            api_key=settings.gemini_api_key,
            model=model,
        )

    else:
        raise ValueError(
            f"Unsupported LLM provider: '{provider}'. "
            f"Supported providers: {[p.value for p in LLMProviderType]}"
        )


def get_embedding_provider(
    provider_name: Optional[str] = None,
    output_dimension: Optional[int] = None,
) -> BaseEmbedding:
    """
    Factory to retrieve configured Embedding provider compatible with LlamaIndex.

    Args:
        provider_name: Optional explicit provider override.
        output_dimension: Optional target vector dimension.

    Returns:
        Instance of BaseEmbedding.
    """
    settings = get_settings()
    provider = (provider_name or settings.embedding_provider).lower().strip()

    if provider == EmbeddingProviderType.MISTRAL:
        if not settings.mistral_api_key:
            raise ValueError("MISTRAL_API_KEY is not configured")
        model = (settings.mistral_embedding_model or "").strip() or "mistral-embed"
        return MistralAIEmbedding(
            api_key=settings.mistral_api_key,
            model_name=model,
        )

    elif provider == EmbeddingProviderType.GEMINI:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
        dim = (
            output_dimension
            or settings.embedding_dimension
            or settings.gemini_embedding_dimension
        )
        model = (settings.gemini_embedding_model or "").strip() or "gemini-embedding-001"
        return GeminiEmbedding(
            api_key=settings.gemini_api_key,
            model_name=model,
            output_dimensionality=dim,
        )

    elif provider == EmbeddingProviderType.DEEPSEEK:
        if not settings.deepseek_api_key:
            raise ValueError("DEEPSEEK_API_KEY is not configured")
        base_url = (
            (settings.deepseek_embedding_base_url or "").strip()
            or (settings.deepseek_base_url or "").strip()
            or "https://api.deepseek.com"
        )
        model = (settings.deepseek_embedding_model or "").strip() or "deepseek-embed"
        logger.info(
            f"Initializing DeepSeek embedding provider with model {model} at {base_url}"
        )
        return OpenAIEmbedding(
            model_name=model,
            api_key=settings.deepseek_api_key,
            api_base=base_url,
        )


    else:
        raise ValueError(
            f"Unsupported embedding provider: '{provider}'. "
            f"Supported providers: {[p.value for p in EmbeddingProviderType]}"
        )


def get_embedding_dimension(provider_name: Optional[str] = None) -> int:
    """
    Get expected vector dimension for the active embedding provider.

    Args:
        provider_name: Optional explicit provider override.

    Returns:
        Integer vector dimension.
    """
    settings = get_settings()
    provider = (provider_name or settings.embedding_provider).lower().strip()

    if settings.embedding_dimension:
        return settings.embedding_dimension

    if provider == EmbeddingProviderType.MISTRAL:
        return 1024
    elif provider == EmbeddingProviderType.GEMINI:
        return settings.gemini_embedding_dimension or 1024
    elif provider == EmbeddingProviderType.DEEPSEEK:
        return settings.deepseek_embedding_dimension or 1536
    return 1024
