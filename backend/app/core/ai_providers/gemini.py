"""Google Gemini provider implementation."""
import logging
from typing import AsyncGenerator, Dict, List, Optional
from pydantic import PrivateAttr
from google import genai
from google.genai import types
from llama_index.core.base.embeddings.base import BaseEmbedding
from app.core.ai_providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class GeminiLLMProvider(BaseLLMProvider):
    """Google Gemini LLM Provider."""

    def __init__(self, api_key: str, model: str = "gemini-3.8-flash"):
        if not api_key:
            raise ValueError("Gemini API key is required")
        self.client = genai.Client(api_key=api_key)
        self.model = model

    def _format_contents_and_system(
        self, messages: List[Dict[str, str]]
    ) -> tuple[Optional[str], List[types.Content]]:
        """Separate system instruction from chat history and format for Gemini."""
        system_instruction = None
        contents: List[types.Content] = []

        for m in messages:
            role = m["role"]
            content_text = m.get("content", "")
            if role == "system":
                if system_instruction is None:
                    system_instruction = content_text
                else:
                    system_instruction += "\n\n" + content_text
            else:
                gemini_role = "user" if role == "user" else "model"
                contents.append(
                    types.Content(
                        role=gemini_role,
                        parts=[types.Part.from_text(text=content_text)],
                    )
                )

        if not contents:
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text="Hello")],
                )
            )

        return system_instruction, contents

    async def complete(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        try:
            system_instruction, contents = self._format_contents_and_system(messages)
            config = types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                system_instruction=system_instruction,
            )
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini chat completion failed: {e}")
            raise RuntimeError(f"Gemini AI call failed: {e}")

    async def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> AsyncGenerator[str, None]:
        try:
            system_instruction, contents = self._format_contents_and_system(messages)
            config = types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                system_instruction=system_instruction,
            )
            stream = await self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=config,
            )
            async for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini streaming failed: {e}")
            raise RuntimeError(f"Gemini streaming failed: {e}")


class GeminiEmbedding(BaseEmbedding):
    """Google Gemini Embedding Model integrating with LlamaIndex."""

    _client: genai.Client = PrivateAttr()
    _output_dimensionality: Optional[int] = PrivateAttr(default=None)

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-embedding-001",
        output_dimensionality: Optional[int] = None,
        **kwargs,
    ):
        super().__init__(model_name=model_name, **kwargs)
        if not api_key:
            raise ValueError("Gemini API key is required")
        self._client = genai.Client(api_key=api_key)
        self._output_dimensionality = output_dimensionality

    def _get_config(self) -> Optional[types.EmbedContentConfig]:
        if self._output_dimensionality:
            return types.EmbedContentConfig(
                output_dimensionality=self._output_dimensionality
            )
        return None

    def _get_query_embedding(self, query: str) -> List[float]:
        response = self._client.models.embed_content(
            model=self.model_name,
            contents=query,
            config=self._get_config(),
        )
        return response.embeddings[0].values

    async def _aget_query_embedding(self, query: str) -> List[float]:
        response = await self._client.aio.models.embed_content(
            model=self.model_name,
            contents=query,
            config=self._get_config(),
        )
        return response.embeddings[0].values

    def _get_text_embedding(self, text: str) -> List[float]:
        response = self._client.models.embed_content(
            model=self.model_name,
            contents=text,
            config=self._get_config(),
        )
        return response.embeddings[0].values

    async def _aget_text_embedding(self, text: str) -> List[float]:
        response = await self._client.aio.models.embed_content(
            model=self.model_name,
            contents=text,
            config=self._get_config(),
        )
        return response.embeddings[0].values

    def _get_text_embeddings(self, texts: List[str]) -> List[List[float]]:
        response = self._client.models.embed_content(
            model=self.model_name,
            contents=texts,
            config=self._get_config(),
        )
        return [e.values for e in response.embeddings]

    async def _aget_text_embeddings(self, texts: List[str]) -> List[List[float]]:
        response = await self._client.aio.models.embed_content(
            model=self.model_name,
            contents=texts,
            config=self._get_config(),
        )
        return [e.values for e in response.embeddings]
