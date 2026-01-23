/**
 * TypeScript types for conversation system
 * Matches backend Pydantic schemas
 */

export interface MessageResponse {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ProfileSummary {
  id: string;
  profile_name: string;
  status: string;
}

export interface RecommendationSummary {
  id: string;
  structured_data?: Record<string, any>;
  feedback_rating?: number;
  created_at: string;
}

export interface SessionResponse {
  id: string;
  profile_id?: string | null;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count: number;
}

export interface SessionListItem {
  id: string;
  profile_id?: string | null;
  profile_name?: string | null;
  title: string;
  last_message?: string | null;
  last_message_at?: string;
  message_count: number;
}

export interface SessionPeriodGroup {
  period: string;
  sessions: SessionListItem[];
}

export interface SessionListResponse {
  sessions: SessionPeriodGroup[];
  total: number;
}

export interface SessionDetailResponse {
  id: string;
  profile_id?: string | null;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: MessageResponse[];
  profile?: ProfileSummary;
  recommendation?: RecommendationSummary;
}

export interface MessagePairResponse {
  user_message: MessageResponse;
  assistant_message: MessageResponse;
}

export interface RecommendationGenerationResponse {
  recommendation_id: string;
  message_id: string;
  ai_response: string;
  structured_data?: Record<string, any>;
}

// Request types
export interface SessionCreate {
  profile_id?: string | null;
  title?: string;
}

export interface SessionUpdate {
  title?: string;
  status?: string;
  profile_id?: string | null;
}

export interface MessageCreate {
  content: string;
}
