"""DeepSeek provider implementation."""
import logging
from typing import AsyncGenerator, Dict, List
from openai import AsyncOpenAI
from app.core.ai_providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class DeepSeekLLMProvider(BaseLLMProvider):
    """DeepSeek LLM Provider using OpenAI-compatible API."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.deepseek.com",
        model: str = "deepseek-chat",
    ):
        if not api_key:
            raise ValueError("DeepSeek API key is required")
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    async def complete(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        try:
            formatted_messages = [
                {"role": m["role"], "content": m["content"]}
                for m in messages
            ]
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"DeepSeek chat completion failed: {e}")
            raise RuntimeError(f"DeepSeek call failed: {e}")

    async def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> AsyncGenerator[str, None]:
        try:
            formatted_messages = [
                {"role": m["role"], "content": m["content"]}
                for m in messages
            ]
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"DeepSeek streaming failed: {e}")
            raise RuntimeError(f"DeepSeek streaming failed: {e}")
