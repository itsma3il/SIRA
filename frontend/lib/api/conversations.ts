/**
 * API client for conversation endpoints
 */

import type {
  SessionResponse,
  SessionListResponse,
  SessionDetailResponse,
  MessagePairResponse,
  RecommendationGenerationResponse,
  SessionCreate,
  SessionUpdate,
  MessageCreate,
} from "@/lib/types/conversation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Create new conversation session
 */
export async function createSession(
  token: string,
  data: SessionCreate
): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE}/api/conversations/sessions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create session: ${error}`);
  }

  return response.json();
}

/**
 * List user's conversation sessions
 */
export async function listSessions(
  token: string,
  params?: {
    profile_id?: string;
    status?: string;
    limit?: number;
  }
): Promise<SessionListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.profile_id) queryParams.set("profile_id", params.profile_id);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.limit) queryParams.set("limit", params.limit.toString());

  const url = `${API_BASE}/api/conversations/sessions${
    queryParams.toString() ? `?${queryParams}` : ""
  }`;

  console.log("[API] Fetching sessions from:", url);

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      // No timeout for this endpoint - may be called during long streaming operations
    });

    console.log("[API] Sessions response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("[API] Sessions error:", error);
      
      // Parse error for better messages
      try {
        const errorJson = JSON.parse(error);
        if (response.status === 401 || errorJson.detail?.includes("expired")) {
          throw new Error("Your session has expired. Please refresh the page.");
        }
        if (response.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error(errorJson.detail || `Failed to list sessions: ${error}`);
      } catch (e) {
        if (e instanceof Error && (e.message.includes("expired") || e.message.includes("requests"))) {
          throw e;
        }
        throw new Error(`Failed to list sessions: ${error}`);
      }
    }

    const data = await response.json();
    console.log("[API] Sessions data received:", data);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.message.includes("timeout")) {
        throw new Error("Request timed out. Please check your connection and try again.");
      }
      if (error.message.includes("fetch") || error.message.includes("network")) {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching sessions.");
  }
}

/**
 * Get session details with messages
 */
export async function getSession(
  token: string,
  sessionId: string
): Promise<SessionDetailResponse> {
  const response = await fetch(
    `${API_BASE}/api/conversations/sessions/${sessionId}`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    
    // Parse error for better messages
    try {
      const errorJson = JSON.parse(error);
      if (errorJson.detail?.includes("expired")) {
        throw new Error("Your session has expired. Please refresh the page.");
      }
      throw new Error(errorJson.detail || `Failed to get session: ${error}`);
    } catch (e) {
      if (e instanceof Error && e.message.includes("expired")) {
        throw e;
      }
      throw new Error(`Failed to get session: ${error}`);
    }
  }

  return response.json();
}

/**
 * Update session title or status
 */
export async function updateSession(
  token: string,
  sessionId: string,
  data: SessionUpdate
): Promise<SessionResponse> {
  const response = await fetch(
    `${API_BASE}/api/conversations/sessions/${sessionId}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update session: ${error}`);
  }

  return response.json();
}

/**
 * Delete session
 */
export async function deleteSession(
  token: string,
  sessionId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/conversations/sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete session: ${error}`);
  }
}

/**
 * Send message and get AI response
 */
export async function sendMessage(
  token: string,
  sessionId: string,
  data: MessageCreate
): Promise<MessagePairResponse> {
  const response = await fetch(
    `${API_BASE}/api/conversations/sessions/${sessionId}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send message: ${error}`);
  }

  return response.json();
}

/**
 * Generate initial recommendation for session
 */
export async function generateRecommendation(
  token: string,
  sessionId: string
): Promise<RecommendationGenerationResponse> {
  const response = await fetch(
    `${API_BASE}/api/conversations/sessions/${sessionId}/recommend`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate recommendation: ${error}`);
  }

  return response.json();
}
