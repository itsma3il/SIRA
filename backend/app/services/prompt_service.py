"""Prompt engineering for AI recommendation generation."""

import json
from typing import Dict, List

from app.models.profile import Profile
from app.schemas.recommendation import RetrievedProgram


SYSTEM_PROMPT = """You are SIRA (Système Intelligent de Recommandation Académique), an expert academic advisor specializing in Moroccan and international university programs.

Your role is to provide highly personalized, data-driven academic orientation based on:
1. Student's academic profile (grades, interests, constraints)
2. Retrieved program data from the knowledge base

### YOUR CONSTRAINTS:
- Use ONLY the provided ACADEMIC_CONTEXT for specific university details
- Base all recommendations on actual data from the retrieved programs
- If student's grades are below typical requirements, suggest "Bridge" paths or accessible alternatives
- Be encouraging but realistic - if there's a clear mismatch (e.g., hates Math but wants Engineering), point it out constructively
- Always cite your sources: Mention specific university and program names from the context

### RESPONSE STRUCTURE:
Your response MUST follow this exact structure:

1. **Summary Analysis** (2-3 sentences)
   - Briefly analyze the student's academic strengths and interests
   - Highlight any notable patterns or concerns

2. **Top 3-5 Recommendations**
   For each recommendation, include:
   - **Program Name**: Full program title
   - **University**: Institution name
   - **Match Score**: Percentage (0-100%) based on alignment with profile
   - **Why it fits**: 2-3 sentences explaining the match
   - **Requirements**: Key admission requirements (GPA, subjects, tests)
   - **Tuition**: Annual cost in MAD
   - **Duration**: Program length

3. **The Roadmap** (Optional)
   - Brief 3-step timeline if applicable (e.g., Year 1-3: Bachelor, Year 4-5: Master)

4. **Visual Data** (REQUIRED - for Chart.js integration)
   At the end of your response, include EXACTLY this JSON block:
   ```json
   {
     "match_scores": [80, 75, 70],
     "program_names": ["Program 1", "Program 2", "Program 3"],
     "difficulty_levels": [7, 8, 6],
     "tuition_fees": [50000, 80000, 30000]
   }
   ```

### LANGUAGE:
- Respond in the student's preferred language (French/English/Arabic)
- Default to French if not specified

### IMPORTANT:
- Do NOT invent programs or universities not in the provided context
- If no good matches exist, be honest and suggest alternative paths
- Consider budget constraints seriously - don't recommend unaffordable programs without mentioning alternatives
"""


def create_user_prompt(profile: Profile, retrieved_programs: List[RetrievedProgram]) -> str:
    """
    Create the user prompt with profile data and retrieved context.
    
    Args:
        profile: Student profile
        retrieved_programs: Programs retrieved from vector search
        
    Returns:
        Formatted user prompt string
    """
    # Format student profile
    profile_text = format_profile_for_prompt(profile)
    
    # Format academic context
    context_text = format_context_for_prompt(retrieved_programs)
    
    # Construct final prompt
    user_prompt = f"""Please analyze the following student profile and provide personalized academic recommendations based on the retrieved program data.

### STUDENT PROFILE:
{profile_text}

### ACADEMIC CONTEXT (Retrieved Programs):
{context_text}

### TASK:
Based on the student's profile and the retrieved programs above, provide your top 3-5 recommendations following the response structure specified in your system prompt. Remember to include the JSON data block at the end for visualization.
"""
    
    return user_prompt


def format_profile_for_prompt(profile: Profile) -> str:
    """Format profile data into readable text for LLM."""
    parts = []
    
    # Basic info
    parts.append(f"**Profile Name:** {profile.profile_name}")
    parts.append(f"**Status:** {profile.status}")
    
    # Academic record
    if profile.academic_record:
        ar = profile.academic_record
        parts.append("\n**Academic Information:**")
        
        if ar.current_status:
            parts.append(f"- Current Status: {ar.current_status}")
        if ar.current_institution:
            parts.append(f"- Institution: {ar.current_institution}")
        if ar.current_field:
            parts.append(f"- Field of Study: {ar.current_field}")
        if ar.gpa:
            parts.append(f"- GPA: {ar.gpa}/20")
        if ar.language_preference:
            parts.append(f"- Language Preference: {ar.language_preference}")
        
        # Subject grades
        if ar.subject_grades:
            parts.append("\n**Subject Grades:**")
            for grade in ar.subject_grades:
                parts.append(f"  - {grade.subject_name}: {grade.grade}/20")
    
    # Preferences
    if profile.preferences:
        prefs = profile.preferences
        parts.append("\n**Interests & Preferences:**")
        
        if prefs.favorite_subjects:
            parts.append(f"- Favorite Subjects: {', '.join(prefs.favorite_subjects)}")
        if prefs.disliked_subjects:
            parts.append(f"- Disliked Subjects: {', '.join(prefs.disliked_subjects)}")
        if prefs.soft_skills:
            parts.append(f"- Soft Skills: {', '.join(prefs.soft_skills)}")
        if prefs.hobbies:
            parts.append(f"- Hobbies: {', '.join(prefs.hobbies)}")
        if prefs.career_goals:
            parts.append(f"- Career Goals: {prefs.career_goals}")
        
        parts.append("\n**Constraints:**")
        if prefs.geographic_preference:
            parts.append(f"- Location Preference: {prefs.geographic_preference}")
        if prefs.budget_range_min or prefs.budget_range_max:
            budget_str = f"{prefs.budget_range_min or 0} - {prefs.budget_range_max or 'unlimited'} MAD/year"
            parts.append(f"- Budget Range: {budget_str}")
    
    return "\n".join(parts)


def format_context_for_prompt(programs: List[RetrievedProgram]) -> str:
    """Format retrieved programs into readable context for LLM."""
    if not programs:
        return "No programs found matching the criteria."
    
    context_parts = []
    
    for idx, program in enumerate(programs, 1):
        context_parts.append(f"\n**Program {idx}:**")
        context_parts.append(f"- **University:** {program.university}")
        context_parts.append(f"- **Program Name:** {program.program_name}")
        context_parts.append(f"- **Relevance Score:** {program.score:.2%}")
        
        # Metadata
        if program.metadata:
            meta = program.metadata
            if "tuition_fee_mad" in meta:
                context_parts.append(f"- **Tuition:** {meta['tuition_fee_mad']} MAD/year")
            if "min_gpa" in meta:
                context_parts.append(f"- **Minimum GPA:** {meta['min_gpa']}/20")
            if "language" in meta:
                context_parts.append(f"- **Language:** {meta['language']}")
            if "degree_type" in meta:
                context_parts.append(f"- **Degree Type:** {meta['degree_type']}")
            if "duration_years" in meta:
                context_parts.append(f"- **Duration:** {meta['duration_years']} years")
            if "field" in meta:
                context_parts.append(f"- **Field:** {meta['field']}")
        
        # Content
        if program.content:
            # Truncate if too long
            content = program.content[:500] + "..." if len(program.content) > 500 else program.content
            context_parts.append(f"- **Description:** {content}")
    
    return "\n".join(context_parts)


def parse_json_from_response(response_text: str) -> Dict:
    """
    Extract and parse JSON data block from LLM response.
    
    Args:
        response_text: Full LLM response text
        
    Returns:
        Parsed JSON dictionary or empty dict if not found
    """
    try:
        # Find JSON block between ```json and ```
        start_marker = "```json"
        end_marker = "```"
        
        start_idx = response_text.find(start_marker)
        if start_idx == -1:
            return {}
        
        start_idx += len(start_marker)
        end_idx = response_text.find(end_marker, start_idx)
        
        if end_idx == -1:
            return {}
        
        json_str = response_text[start_idx:end_idx].strip()
        return json.loads(json_str)
    
    except (json.JSONDecodeError, ValueError):
        return {}
