"""Base interfaces and types for AI and Embedding providers."""
from abc import ABC, abstractmethod
from enum import Enum
from typing import AsyncGenerator, Dict, List, Optional


class LLMProviderType(str, Enum):
    MISTRAL = "mistral"
    DEEPSEEK = "deepseek"
    GEMINI = "gemini"


class EmbeddingProviderType(str, Enum):
    MISTRAL = "mistral"
    GEMINI = "gemini"
    DEEPSEEK = "deepseek"


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def complete(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """
        Generate a complete text response from messages.
        
        Args:
            messages: List of chat messages with 'role' and 'content'.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens in response.
            
        Returns:
            Generated response string.
        """
        pass

    @abstractmethod
    async def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chunks of text response from messages.
        
        Args:
            messages: List of chat messages with 'role' and 'content'.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens in response.
            
        Yields:
            Chunks of text as they arrive.
        """
        pass
