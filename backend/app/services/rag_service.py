"""RAG retrieval service for finding relevant academic programs."""

from typing import Dict, List, Optional
from uuid import UUID

from app.core.vector_db import get_pinecone_manager
from app.models.profile import Profile
from app.services.query_service import build_metadata_filters, enhance_query_with_context, profile_to_query
from app.schemas.recommendation import RetrievedProgram


async def retrieve_relevant_programs(
    profile: Profile,
    top_k: int = 5,
    enhance_query: bool = True
) -> List[RetrievedProgram]:
    """
    Retrieve relevant academic programs using hybrid search (semantic + metadata filtering).
    
    This function performs the core RAG retrieval:
    1. Converts profile to semantic query
    2. Builds metadata filters from constraints
    3. Queries Pinecone vector database
    4. Returns ranked results with scores
    
    Args:
        profile: Student profile to generate recommendations for
        top_k: Number of programs to retrieve (default: 5)
        enhance_query: Whether to enhance query with additional context
        
    Returns:
        List of retrieved programs with relevance scores
    """
    # Step 1: Construct semantic query from profile
    base_query = profile_to_query(profile)
    
    if enhance_query:
        query_text = enhance_query_with_context(base_query, profile)
    else:
        query_text = base_query
    
    # Step 2: Build metadata filters for hard constraints
    filters = build_metadata_filters(profile)
    
    # Step 3: Query Pinecone
    manager = get_pinecone_manager()
    results = manager.query(
        query_text=query_text,
        filters=filters if filters else None,
        top_k=top_k
    )
    
    # Step 4: Convert to schema objects
    retrieved_programs = []
    for result in results:
        program = RetrievedProgram(
            university=result.get("university", "Unknown"),
            program_name=result.get("program_name", "Unknown Program"),
            score=result.get("score", 0.0),
            metadata=result.get("metadata", {}),
            content=result.get("content", "")
        )
        retrieved_programs.append(program)
    
    return retrieved_programs


async def retrieve_with_fallback(
    profile: Profile,
    top_k: int = 5
) -> tuple[List[RetrievedProgram], str]:
    """
    Retrieve programs with fallback strategy if no results found.
    
    Strategy:
    1. Try with full filters
    2. If no results, try with relaxed budget constraint
    3. If still no results, try with no filters (semantic only)
    
    Args:
        profile: Student profile
        top_k: Number of programs to retrieve
        
    Returns:
        Tuple of (retrieved programs, strategy used)
    """
    # Try with all filters
    programs = await retrieve_relevant_programs(profile, top_k=top_k)
    
    if programs:
        return programs, "full_constraints"
    
    # Fallback 1: Relax budget constraint
    if profile.preferences and profile.preferences.budget_range_max:
        original_budget = profile.preferences.budget_range_max
        profile.preferences.budget_range_max = None  # Remove budget filter
        
        programs = await retrieve_relevant_programs(profile, top_k=top_k)
        profile.preferences.budget_range_max = original_budget  # Restore
        
        if programs:
            return programs, "relaxed_budget"
    
    # Fallback 2: Remove all filters (semantic only)
    # Create a temporary profile with no constraints
    query_text = profile_to_query(profile)
    manager = get_pinecone_manager()
    results = manager.query(query_text=query_text, filters=None, top_k=top_k)
    
    programs = [
        RetrievedProgram(
            university=r.get("university", "Unknown"),
            program_name=r.get("program_name", "Unknown"),
            score=r.get("score", 0.0),
            metadata=r.get("metadata", {}),
            content=r.get("content", "")
        )
        for r in results
    ]
    
    return programs, "semantic_only"


def format_context_for_llm(programs: List[RetrievedProgram], max_programs: int = 5) -> str:
    """
    Format retrieved programs into context string for LLM prompt.
    
    Args:
        programs: Retrieved programs
        max_programs: Maximum number to include in context
        
    Returns:
        Formatted context string
    """
    context_parts = []
    
    for idx, program in enumerate(programs[:max_programs], 1):
        context_parts.append(f"### Program {idx}: {program.university} - {program.program_name}")
        context_parts.append(f"**Relevance Score:** {program.score:.2f}")
        context_parts.append(f"**Content:** {program.content}")
        
        # Add key metadata
        if program.metadata:
            meta = program.metadata
            if "tuition_fee_mad" in meta:
                context_parts.append(f"**Tuition:** {meta['tuition_fee_mad']} MAD/year")
            if "min_gpa" in meta:
                context_parts.append(f"**Minimum GPA:** {meta['min_gpa']}/20")
            if "language" in meta:
                context_parts.append(f"**Language:** {meta['language']}")
            if "degree_type" in meta:
                context_parts.append(f"**Degree:** {meta['degree_type']}")
            if "duration_years" in meta:
                context_parts.append(f"**Duration:** {meta['duration_years']} years")
        
        context_parts.append("")  # Empty line between programs
    
    return "\n".join(context_parts)
