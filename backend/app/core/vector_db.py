"""Pinecone vector database utilities for SIRA."""
import logging
import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
from llama_index.core import VectorStoreIndex, Document
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.mistralai import MistralAIEmbedding
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Disable SSL verification for development (can cause SSL errors with some networks)
# Set PINECONE_SKIP_SSL=false in production
SKIP_SSL = os.getenv("PINECONE_SKIP_SSL", "true").lower() == "true"


class PineconeManager:
    """Manages Pinecone vector database operations."""
    
    def __init__(self):
        """Initialize Pinecone client and index."""
        if not settings.pinecone_api_key:
            raise ValueError("PINECONE_API_KEY not configured")
        
        # Initialize Pinecone with optional SSL bypass
        pc_kwargs = {"api_key": settings.pinecone_api_key}
        if SKIP_SSL:
            logger.warning("⚠️ SSL verification disabled for Pinecone (development mode)")
            # Set environment variable to disable SSL verification
            os.environ["GRPC_CLIENT_CHANNEL_TARGET_SSL_CERT_VERIFY"] = "false"
        
        self.pc = Pinecone(**pc_kwargs)
        self.index_name = settings.pinecone_index_name
        self.embedding_model = MistralAIEmbedding(
            api_key=settings.mistral_api_key,
            model_name=settings.mistral_embedding_model
        )
        
        logger.info(f"Initialized PineconeManager with index: {self.index_name}")
    
    def create_index_if_not_exists(
        self, 
        dimension: int = 1024,  # Mistral embed dimension
        metric: str = "cosine"
    ) -> None:
        """
        Create Pinecone index if it doesn't exist.
        
        Args:
            dimension: Vector dimension (1024 for Mistral embeddings)
            metric: Distance metric (cosine, euclidean, dotproduct)
        """
        try:
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                logger.info(f"Creating new index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=dimension,
                    metric=metric,
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=settings.pinecone_environment or "us-east-1"
                    )
                )
                logger.info(f"Index {self.index_name} created successfully")
            else:
                logger.info(f"Index {self.index_name} already exists")
        except Exception as e:
            logger.error(f"Error creating index: {e}")
            raise
    
    def get_index(self):
        """Get Pinecone index instance."""
        return self.pc.Index(self.index_name)
    
    def get_vector_store(self) -> PineconeVectorStore:
        """
        Get LlamaIndex PineconeVectorStore instance.
        
        Returns:
            Configured PineconeVectorStore
        """
        pinecone_index = self.get_index()
        return PineconeVectorStore(pinecone_index=pinecone_index)
    
    def create_index_from_documents(
        self, 
        documents: List[Document]
    ) -> VectorStoreIndex:
        """
        Create vector index from documents.
        
        Args:
            documents: List of LlamaIndex Document objects
            
        Returns:
            VectorStoreIndex instance
        """
        try:
            vector_store = self.get_vector_store()
            index = VectorStoreIndex.from_documents(
                documents,
                vector_store=vector_store,
                embed_model=self.embedding_model,
                show_progress=True
            )
            logger.info(f"Indexed {len(documents)} documents")
            return index
        except Exception as e:
            logger.error(f"Error indexing documents: {e}")
            raise
    
    def query(
        self,
        query_text: str,
        filters: Optional[Dict[str, Any]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Query vector database with optional metadata filters.
        
        Args:
            query_text: Search query
            filters: Metadata filters (e.g., {"university": "UM6P"})
            top_k: Number of results to return
            
        Returns:
            List of matching documents with scores
        """
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.get_text_embedding(query_text)
            
            # Query Pinecone
            index = self.get_index()
            results = index.query(
                vector=query_embedding,
                filter=filters,
                top_k=top_k,
                include_metadata=True
            )
            
            return [
                {
                    "id": match.id,
                    "score": match.score,
                    "metadata": match.metadata
                }
                for match in results.matches
            ]
        except Exception as e:
            logger.error(f"Error querying vector database: {e}")
            raise
    
    def delete_by_metadata(self, filters: Dict[str, Any]) -> None:
        """
        Delete vectors by metadata filter.
        
        Args:
            filters: Metadata filters (e.g., {"source": "program_catalog.pdf"})
        """
        try:
            index = self.get_index()
            index.delete(filter=filters)
            logger.info(f"Deleted vectors matching filters: {filters}")
        except Exception as e:
            logger.error(f"Error deleting vectors: {e}")
            raise
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the Pinecone index.
        
        Returns:
            Dictionary with index statistics
        """
        try:
            index = self.get_index()
            stats = index.describe_index_stats()
            return {
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": stats.namespaces
            }
        except Exception as e:
            logger.error(f"Error getting index stats: {e}")
            raise


# Singleton instance
_pinecone_manager: Optional[PineconeManager] = None


def get_pinecone_manager() -> PineconeManager:
    """
    Get or create singleton PineconeManager instance.
    
    Returns:
        PineconeManager instance
    """
    global _pinecone_manager
    if _pinecone_manager is None:
        _pinecone_manager = PineconeManager()
    return _pinecone_manager
