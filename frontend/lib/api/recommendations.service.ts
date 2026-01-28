/**
 * Recommendations API Service
 * 
 * Provides methods for generating and managing academic program recommendations.
 */

import { BaseApiService } from './base.service';
import type {
  Recommendation,
  RecommendationCreate,
  RecommendationFeedback,
  RecommendationList,
} from '@/lib/types/recommendation';

export class RecommendationsService extends BaseApiService {
  /**
   * Generate a new recommendation
   * Note: Requires both profile_id and session_id
   */
  async generate(token: string, data: RecommendationCreate): Promise<Recommendation> {
    return this.post<Recommendation, RecommendationCreate>(
      '/api/recommendations/generate',
      token,
      data
    );
  }

  /**
   * Get all recommendations for a profile
   */
  async getByProfile(
    token: string,
    profileId: string,
    limit: number = 10
  ): Promise<RecommendationList> {
    return this.get<RecommendationList>(
      `/api/recommendations/profile/${profileId}`,
      token,
      { limit }
    );
  }

  /**
   * Get a specific recommendation by ID
   */
  async getById(token: string, recommendationId: string): Promise<Recommendation> {
    return this.get<Recommendation>(
      `/api/recommendations/${recommendationId}`,
      token
    );
  }

  /**
   * Submit feedback for a recommendation
   */
  async submitFeedback(
    token: string,
    recommendationId: string,
    feedback: RecommendationFeedback
  ): Promise<Recommendation> {
    return this.post<Recommendation, RecommendationFeedback>(
      `/api/recommendations/${recommendationId}/feedback`,
      token,
      feedback
    );
  }

  /**
   * Delete a recommendation
   */
  async deleteById(token: string, recommendationId: string): Promise<void> {
    return this.delete<void>(`/api/recommendations/${recommendationId}`, token);
  }
}
