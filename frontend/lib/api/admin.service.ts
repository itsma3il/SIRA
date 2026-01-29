/**
 * Admin API Service
 * Handles all admin-related API calls for monitoring and analytics
 */

import { BaseApiService } from "./base.service";

export interface ProgramCount {
  program: string;
  count: number;
}

export interface DashboardMetrics {
  total_users: number;
  new_users_period: number;
  active_users: number;
  total_profiles: number;
  total_recommendations: number;
  total_sessions: number;
  recommendations_with_feedback: number;
  avg_feedback_rating: number;
  top_recommended_programs: ProgramCount[];
  low_rated_recommendations_count: number;
  period_days: number;
}

export interface ProfileListItem {
  id: string;
  user_id: string;
  profile_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  current_education_level: string | null;
  current_field: string | null;
  target_field: string | null;
  user_email?: string;
}

export interface SessionListItem {
  id: string;
  user_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  user_email?: string;
  profile_name?: string;
}

export interface RecommendationListItem {
  id: string;
  profile_id: string;
  session_id: string;
  created_at: string;
  feedback_rating?: number;
  feedback_comment?: string;
  user_email?: string;
  profile_name?: string;
  program_count: number;
}

export interface ProgramInfo {
  name: string;
  match_score?: number;
}

export interface RecommendationAnalytics {
  id: string;
  profile_id: string;
  session_id: string;
  query: string;
  retrieved_context?: any;
  ai_response: string;
  structured_data?: any;
  created_at: string;
  feedback_rating?: number;
  feedback_comment?: string;
  profile_name?: string;
  user_email?: string;
  programs: ProgramInfo[];
}

export class AdminService extends BaseApiService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(token: string, days: number = 30): Promise<DashboardMetrics> {
    return this.get<DashboardMetrics>(`/api/admin/dashboard/metrics?days=${days}`, token);
  }

  /**
   * List all profiles
   */
  async listProfiles(
    token: string,
    options?: { skip?: number; limit?: number; status?: string }
  ): Promise<ProfileListItem[]> {
    const params = new URLSearchParams();
    if (options?.skip !== undefined) params.append("skip", options.skip.toString());
    if (options?.limit !== undefined) params.append("limit", options.limit.toString());
    if (options?.status) params.append("status", options.status);

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.get<ProfileListItem[]>(`/api/admin/profiles${query}`, token);
  }

  /**
   * List all sessions
   */
  async listSessions(
    token: string,
    options?: { skip?: number; limit?: number; status?: string }
  ): Promise<SessionListItem[]> {
    const params = new URLSearchParams();
    if (options?.skip !== undefined) params.append("skip", options.skip.toString());
    if (options?.limit !== undefined) params.append("limit", options.limit.toString());
    if (options?.status) params.append("status", options.status);

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.get<SessionListItem[]>(`/api/admin/sessions${query}`, token);
  }

  /**
   * List all recommendations
   */
  async listRecommendations(
    token: string,
    options?: {
      skip?: number;
      limit?: number;
      min_rating?: number;
      max_rating?: number;
      has_feedback?: boolean;
    }
  ): Promise<RecommendationListItem[]> {
    const params = new URLSearchParams();
    if (options?.skip !== undefined) params.append("skip", options.skip.toString());
    if (options?.limit !== undefined) params.append("limit", options.limit.toString());
    if (options?.min_rating !== undefined) params.append("min_rating", options.min_rating.toString());
    if (options?.max_rating !== undefined) params.append("max_rating", options.max_rating.toString());
    if (options?.has_feedback !== undefined) params.append("has_feedback", options.has_feedback.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.get<RecommendationListItem[]>(`/api/admin/recommendations${query}`, token);
  }

  /**
   * Get detailed analytics for a recommendation
   */
  async getRecommendationAnalytics(token: string, recommendationId: string): Promise<RecommendationAnalytics> {
    return this.get<RecommendationAnalytics>(`/api/admin/recommendations/${recommendationId}/analytics`, token);
  }
}
