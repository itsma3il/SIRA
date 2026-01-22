/**
 * API client for Recommendation endpoints
 */

import type {
  Recommendation,
  RecommendationCreate,
  RecommendationFeedback,
  RecommendationList,
} from "@/lib/types/recommendation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Generate a new recommendation for a profile
 */
export async function generateRecommendation(
  profileId: string,
  token: string
): Promise<Recommendation> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ profile_id: profileId } as RecommendationCreate),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to generate recommendation" }));
    throw new Error(error.detail || "Failed to generate recommendation");
  }

  return response.json();
}

/**
 * Get all recommendations for a profile
 */
export async function getProfileRecommendations(
  profileId: string,
  token: string,
  limit: number = 10
): Promise<RecommendationList> {
  const response = await fetch(
    `${API_BASE_URL}/api/recommendations/profile/${profileId}?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch recommendations" }));
    throw new Error(error.detail || "Failed to fetch recommendations");
  }

  return response.json();
}

/**
 * Get a specific recommendation by ID
 */
export async function getRecommendation(
  recommendationId: string,
  token: string
): Promise<Recommendation> {
  const response = await fetch(
    `${API_BASE_URL}/api/recommendations/${recommendationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch recommendation" }));
    throw new Error(error.detail || "Failed to fetch recommendation");
  }

  return response.json();
}

/**
 * Submit feedback for a recommendation
 */
export async function submitRecommendationFeedback(
  recommendationId: string,
  feedback: RecommendationFeedback,
  token: string
): Promise<Recommendation> {
  const response = await fetch(
    `${API_BASE_URL}/api/recommendations/${recommendationId}/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(feedback),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to submit feedback" }));
    throw new Error(error.detail || "Failed to submit feedback");
  }

  return response.json();
}
