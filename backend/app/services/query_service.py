"""Query construction service for converting profiles to search queries."""

from typing import Dict, List, Optional
from uuid import UUID

from app.models.profile import Profile


def profile_to_query(profile: Profile) -> str:
    """
    Convert a student profile into a semantic search query.
    
    This function extracts key information from the profile and constructs
    a natural language query optimized for semantic search in the vector database.
    
    Args:
        profile: Student profile with academic records and preferences
        
    Returns:
        Natural language search query string
    """
    query_parts = []
    
    # Academic field and current status
    if profile.academic_record:
        ar = profile.academic_record
        
        if ar.current_field:
            query_parts.append(f"Programs in {ar.current_field}")
        
        if ar.current_status:
            status_map = {
                "high_school": "for high school graduates",
                "undergrad": "for undergraduate students",
                "career_switcher": "for career transition"
            }
            query_parts.append(status_map.get(ar.current_status, ""))
    
    # Student interests and preferences
    if profile.preferences:
        prefs = profile.preferences
        
        if prefs.favorite_subjects:
            subjects = ", ".join(prefs.favorite_subjects[:3])  # Top 3
            query_parts.append(f"with focus on {subjects}")
        
        if prefs.career_goals:
            query_parts.append(f"leading to careers in {prefs.career_goals}")
    
    # Construct final query
    query = " ".join(filter(None, query_parts))
    
    if not query:
        query = "academic programs suitable for students"
    
    return query


def build_metadata_filters(profile: Profile) -> Dict:
    """
    Build Pinecone metadata filters based on profile constraints.
    
    Filters are used to narrow down results based on hard requirements
    like GPA, budget, and location preferences.
    
    Args:
        profile: Student profile with constraints
        
    Returns:
        Dictionary of Pinecone filter conditions
    """
    filters = {}
    
    if profile.academic_record and profile.academic_record.gpa:
        # Only show programs where student meets minimum GPA
        # Using $gte because we want programs with min_gpa <= student's GPA
        filters["min_gpa"] = {"$lte": float(profile.academic_record.gpa)}
    
    if profile.preferences:
        prefs = profile.preferences
        
        # Budget constraint (tuition fee must be <= student's max budget)
        if prefs.budget_range_max:
            filters["tuition_fee_mad"] = {"$lte": prefs.budget_range_max}
        
        # Geographic preference
        if prefs.geographic_preference:
            # Exact match or contains (depending on how data is stored)
            filters["location"] = {"$eq": prefs.geographic_preference}
        
        # Language preference (if stored in preferences)
        if profile.academic_record and profile.academic_record.language_preference:
            lang = profile.academic_record.language_preference
            if lang in ["French", "English", "Arabic"]:
                filters["language"] = {"$eq": lang}
    
    return filters


def enhance_query_with_context(
    base_query: str,
    profile: Profile,
    include_negative_signals: bool = False
) -> str:
    """
    Enhance the base query with additional context for better retrieval.
    
    Args:
        base_query: Base semantic query
        profile: Student profile
        include_negative_signals: Whether to include subjects to avoid
        
    Returns:
        Enhanced query string
    """
    enhanced_parts = [base_query]
    
    if profile.preferences and include_negative_signals:
        if profile.preferences.disliked_subjects:
            # Note: This might not work well with pure semantic search
            # Better handled at the LLM level
            pass
    
    # Add soft skills context
    if profile.preferences and profile.preferences.soft_skills:
        skills = ", ".join(profile.preferences.soft_skills[:2])
        enhanced_parts.append(f"Suitable for students with skills in {skills}.")
    
    # Add hobbies context (can indicate interests)
    if profile.preferences and profile.preferences.hobbies:
        hobbies = ", ".join(profile.preferences.hobbies[:2])
        enhanced_parts.append(f"Student interests include {hobbies}.")
    
    return " ".join(enhanced_parts)
