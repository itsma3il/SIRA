"""Unit tests for AI and Embedding providers."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.core.ai_providers.base import (
    BaseLLMProvider,
    LLMProviderType,
    EmbeddingProviderType,
)
from app.core.ai_providers.mistral import MistralLLMProvider
from app.core.ai_providers.deepseek import DeepSeekLLMProvider
from app.core.ai_providers.gemini import GeminiLLMProvider, GeminiEmbedding
from app.core.ai_providers.factory import (
    get_llm_provider,
    get_embedding_provider,
    get_embedding_dimension,
)
from app.core.config import Settings
from app.services.recommendation_service import RecommendationService
from app.services.conversational_ai_service import ConversationalAIService


class TestProviderTypes:
    """Tests for provider enum types."""

    def test_llm_provider_types(self):
        assert LLMProviderType.MISTRAL == "mistral"
        assert LLMProviderType.DEEPSEEK == "deepseek"
        assert LLMProviderType.GEMINI == "gemini"

    def test_embedding_provider_types(self):
        assert EmbeddingProviderType.MISTRAL == "mistral"
        assert EmbeddingProviderType.GEMINI == "gemini"
        assert EmbeddingProviderType.DEEPSEEK == "deepseek"


class TestMistralProvider:
    """Tests for Mistral LLM provider."""

    def test_init_requires_key(self):
        with pytest.raises(ValueError, match="Mistral API key is required"):
            MistralLLMProvider(api_key="")

    @pytest.mark.asyncio
    async def test_complete(self):
        provider = MistralLLMProvider(api_key="mock-key", model="mistral-large-latest")
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Mistral answer"))]
        provider.client.chat.complete = MagicMock(return_value=mock_response)

        result = await provider.complete([{"role": "user", "content": "hi"}])
        assert result == "Mistral answer"
        provider.client.chat.complete.assert_called_once()

    @pytest.mark.asyncio
    async def test_stream(self):
        provider = MistralLLMProvider(api_key="mock-key", model="mistral-large-latest")
        chunk1 = MagicMock(data=MagicMock(choices=[MagicMock(delta=MagicMock(content="Hello "))]))
        chunk2 = MagicMock(data=MagicMock(choices=[MagicMock(delta=MagicMock(content="world!"))]))
        provider.client.chat.stream = MagicMock(return_value=[chunk1, chunk2])

        chunks = []
        async for piece in provider.stream([{"role": "user", "content": "hi"}]):
            chunks.append(piece)

        assert "".join(chunks) == "Hello world!"


class TestDeepSeekProvider:
    """Tests for DeepSeek LLM provider."""

    def test_init_requires_key(self):
        with pytest.raises(ValueError, match="DeepSeek API key is required"):
            DeepSeekLLMProvider(api_key="")

    @pytest.mark.asyncio
    async def test_complete(self):
        provider = DeepSeekLLMProvider(
            api_key="mock-deepseek-key",
            base_url="https://api.deepseek.com",
            model="deepseek-chat"
        )
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="DeepSeek answer"))]
        provider.client.chat.completions.create = AsyncMock(return_value=mock_response)

        result = await provider.complete([{"role": "user", "content": "hi"}])
        assert result == "DeepSeek answer"
        provider.client.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_stream(self):
        provider = DeepSeekLLMProvider(
            api_key="mock-deepseek-key",
            base_url="https://api.deepseek.com",
            model="deepseek-chat"
        )
        chunk1 = MagicMock(choices=[MagicMock(delta=MagicMock(content="Deep"))])
        chunk2 = MagicMock(choices=[MagicMock(delta=MagicMock(content="Seek"))])

        async def mock_async_stream(*args, **kwargs):
            for c in [chunk1, chunk2]:
                yield c

        provider.client.chat.completions.create = AsyncMock(side_effect=mock_async_stream)

        chunks = []
        async for piece in provider.stream([{"role": "user", "content": "hi"}]):
            chunks.append(piece)

        assert "".join(chunks) == "DeepSeek"


class TestGeminiProvider:
    """Tests for Google Gemini LLM and Embedding providers."""

    def test_llm_init_requires_key(self):
        with pytest.raises(ValueError, match="Gemini API key is required"):
            GeminiLLMProvider(api_key="")

    def test_format_contents_and_system(self):
        provider = GeminiLLMProvider(api_key="mock-key", model="gemini-3.8-flash")
        messages = [
            {"role": "system", "content": "You are an advisor."},
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Welcome!"},
        ]
        system_instruction, contents = provider._format_contents_and_system(messages)
        assert system_instruction == "You are an advisor."
        assert len(contents) == 2
        assert contents[0].role == "user"
        assert contents[1].role == "model"

    @pytest.mark.asyncio
    async def test_complete(self):
        provider = GeminiLLMProvider(api_key="mock-key", model="gemini-3.8-flash")
        mock_response = MagicMock(text="Gemini answer")
        provider.client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        result = await provider.complete([{"role": "user", "content": "hi"}])
        assert result == "Gemini answer"

    @pytest.mark.asyncio
    async def test_stream(self):
        provider = GeminiLLMProvider(api_key="mock-key", model="gemini-3.8-flash")
        chunk1 = MagicMock(text="Gemini ")
        chunk2 = MagicMock(text="stream")

        async def mock_stream(*args, **kwargs):
            for c in [chunk1, chunk2]:
                yield c

        provider.client.aio.models.generate_content_stream = AsyncMock(side_effect=mock_stream)

        chunks = []
        async for piece in provider.stream([{"role": "user", "content": "hi"}]):
            chunks.append(piece)

        assert "".join(chunks) == "Gemini stream"

    def test_embedding_init_requires_key(self):
        with pytest.raises(ValueError, match="Gemini API key is required"):
            GeminiEmbedding(api_key="")

    def test_embedding_methods(self):
        emb = GeminiEmbedding(
            api_key="mock-key",
            model_name="gemini-embedding-001",
            output_dimensionality=1024,
        )
        mock_resp = MagicMock()
        mock_resp.embeddings = [MagicMock(values=[0.1] * 1024)]
        emb._client.models.embed_content = MagicMock(return_value=mock_resp)

        query_vec = emb.get_query_embedding("sample query")
        assert len(query_vec) == 1024
        assert query_vec[0] == 0.1

        text_vec = emb.get_text_embedding("sample text")
        assert len(text_vec) == 1024


class TestFactory:
    """Tests for get_llm_provider, get_embedding_provider, and dimensions."""

    def test_get_llm_provider_mistral(self):
        mock_settings = Settings(
            llm_provider="mistral",
            mistral_api_key="test-key",
            mistral_llm_model="mistral-large-latest",
        )
        with patch("app.core.ai_providers.factory.get_settings", return_value=mock_settings):
            provider = get_llm_provider()
            assert isinstance(provider, MistralLLMProvider)

    def test_get_llm_provider_deepseek(self):
        mock_settings = Settings(
            llm_provider="deepseek",
            deepseek_api_key="test-key",
            deepseek_llm_model="deepseek-chat",
        )
        with patch("app.core.ai_providers.factory.get_settings", return_value=mock_settings):
            provider = get_llm_provider()
            assert isinstance(provider, DeepSeekLLMProvider)

    def test_get_llm_provider_gemini(self):
        mock_settings = Settings(
            llm_provider="gemini",
            gemini_api_key="test-key",
            gemini_llm_model="gemini-3.8-flash",
        )
        with patch("app.core.ai_providers.factory.get_settings", return_value=mock_settings):
            provider = get_llm_provider()
            assert isinstance(provider, GeminiLLMProvider)

    def test_get_llm_provider_unsupported(self):
        mock_settings = Settings(
            llm_provider="unknown_provider",
        )
        with patch("app.core.ai_providers.factory.get_settings", return_value=mock_settings):
            with pytest.raises(ValueError, match="Unsupported LLM provider"):
                get_llm_provider()

    def test_get_embedding_provider_gemini(self):
        mock_settings = Settings(
            embedding_provider="gemini",
            gemini_api_key="test-key",
            gemini_embedding_model="gemini-embedding-001",
            gemini_embedding_dimension=1024,
        )
        with patch("app.core.ai_providers.factory.get_settings", return_value=mock_settings):
            provider = get_embedding_provider()
            assert isinstance(provider, GeminiEmbedding)

    def test_get_embedding_dimensions(self):
        mock_mistral = Settings(embedding_provider="mistral", embedding_dimension=None)
        with patch("app.core.ai_providers.factory.get_settings", return_value=mock_mistral):
            assert get_embedding_dimension() == 1024

        mock_gemini = Settings(
            embedding_provider="gemini",
            embedding_dimension=None,
            gemini_embedding_dimension=768,
        )
        with patch("app.core.ai_providers.factory.get_settings", return_value=mock_gemini):
            assert get_embedding_dimension() == 768

        mock_override = Settings(embedding_provider="gemini", embedding_dimension=1024)
        with patch("app.core.ai_providers.factory.get_settings", return_value=mock_override):
            assert get_embedding_dimension() == 1024


class TestServiceIntegration:
    """Test service classes accept mock providers."""

    def test_recommendation_service_with_custom_provider(self):
        mock_llm = MagicMock(spec=BaseLLMProvider)
        service = RecommendationService(llm_provider=mock_llm)
        assert service.llm_provider is mock_llm

    def test_conversational_service_with_custom_provider(self):
        mock_llm = MagicMock(spec=BaseLLMProvider)
        service = ConversationalAIService(llm_provider=mock_llm)
        assert service.llm_provider is mock_llm
