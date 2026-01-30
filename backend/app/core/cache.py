"""
Redis Caching Layer
Provides caching utilities for recommendations and profiles
"""

import json
import logging
from typing import Optional, Any
from datetime import timedelta
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Redis cache service for SIRA."""
    
    def __init__(self):
        """Initialize Redis connection."""
        self.enabled = settings.REDIS_ENABLED
        self.client: Optional[redis.Redis] = None
        
        if self.enabled:
            try:
                self.client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD,
                    db=settings.REDIS_DB,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                self.client.ping()
                logger.info("Redis cache connected successfully")
            except Exception as e:
                logger.warning(f"Redis connection failed, caching disabled: {str(e)}")
                self.enabled = False
                self.client = None
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        if not self.enabled or not self.client:
            return None
        
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {str(e)}")
            return None
    
    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (default: 1 hour)
            
        Returns:
            True if successful
        """
        if not self.enabled or not self.client:
            return False
        
        try:
            serialized = json.dumps(value)
            if ttl:
                self.client.setex(key, ttl, serialized)
            else:
                self.client.setex(key, 3600, serialized)  # Default 1 hour
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful
        """
        if not self.enabled or not self.client:
            return False
        
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {str(e)}")
            return False
    
    def delete_pattern(self, pattern: str) -> bool:
        """
        Delete all keys matching pattern.
        
        Args:
            pattern: Redis pattern (e.g., "user:*")
            
        Returns:
            True if successful
        """
        if not self.enabled or not self.client:
            return False
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {str(e)}")
            return False
    
    def clear_all(self) -> bool:
        """
        Clear all cache entries.
        
        Returns:
            True if successful
        """
        if not self.enabled or not self.client:
            return False
        
        try:
            self.client.flushdb()
            logger.info("Cache cleared successfully")
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {str(e)}")
            return False


# Global cache instance
cache = CacheService()


def cache_key_profile(user_id: str) -> str:
    """Generate cache key for user profile."""
    return f"profile:{user_id}"


def cache_key_recommendations(user_id: str, session_id: str) -> str:
    """Generate cache key for recommendations."""
    return f"recommendations:{user_id}:{session_id}"


def cache_key_documents(user_id: str) -> str:
    """Generate cache key for user documents."""
    return f"documents:{user_id}"


def invalidate_user_cache(user_id: str) -> None:
    """Invalidate all cache entries for a user."""
    cache.delete_pattern(f"profile:{user_id}")
    cache.delete_pattern(f"recommendations:{user_id}:*")
    cache.delete_pattern(f"documents:{user_id}")
