/**
 * TypeScript types for Recommendation API
 */

export interface RetrievedProgram {
  university: string;
  program_name: string;
  score: number;
  metadata: Record<string, any>;
  content: string;
}

export interface Recommendation {
  id: string;
  profile_id: string;
  query: string;
  retrieved_context: RetrievedProgram[] | null;
  ai_response: string;
  structured_data: {
    match_scores?: number[];
    program_names?: string[];
    difficulty_levels?: number[];
    tuition_fees?: number[];
  } | null;
  created_at: string;
  feedback_rating: number | null;
  feedback_comment: string | null;
}

export interface RecommendationCreate {
  profile_id: string;
}

export interface RecommendationFeedback {
  feedback_rating: number; // 1-5
  feedback_comment?: string;
}

export interface RecommendationList {
  recommendations: Recommendation[];
  total: number;
}
