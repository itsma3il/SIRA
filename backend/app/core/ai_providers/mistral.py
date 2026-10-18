"""Mistral AI provider implementation."""
import logging
from typing import AsyncGenerator, Dict, List
from mistralai import Mistral
from app.core.ai_providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class MistralLLMProvider(BaseLLMProvider):
    """Mistral AI LLM Provider."""

    def __init__(self, api_key: str, model: str = "mistral-large-latest"):
        if not api_key:
            raise ValueError("Mistral API key is required")
        self.client = Mistral(api_key=api_key)
        self.model = model

    async def complete(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        try:
            response = self.client.chat.complete(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Mistral chat completion failed: {e}")
            raise RuntimeError(f"Mistral AI call failed: {e}")

    async def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> AsyncGenerator[str, None]:
        try:
            stream = self.client.chat.stream(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            for chunk in stream:
                if chunk.data.choices and chunk.data.choices[0].delta.content:
                    yield chunk.data.choices[0].delta.content
        except Exception as e:
            logger.error(f"Mistral streaming failed: {e}")
            raise RuntimeError(f"Mistral streaming failed: {e}")
