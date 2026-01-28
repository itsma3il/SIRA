/**
 * Conversations API Service
 * 
 * Provides methods for managing conversation sessions, messages,
 * and real-time chat interactions.
 */

import { BaseApiService } from './base.service';
import type {
  SessionResponse,
  SessionListResponse,
  SessionDetailResponse,
  MessagePairResponse,
  RecommendationGenerationResponse,
  SessionCreate,
  SessionUpdate,
  MessageCreate,
} from '@/lib/types/conversation';

export class ConversationsService extends BaseApiService {
  /**
   * List all conversation sessions for the authenticated user
   */
  async listSessions(
    token: string,
    params?: {
      profile_id?: string;
      status?: string;
      limit?: number;
    }
  ): Promise<SessionListResponse> {
    return this.get<SessionListResponse>('/api/conversations/sessions', token, params);
  }

  /**
   * Get a specific session with messages
   */
  async getSession(token: string, sessionId: string): Promise<SessionDetailResponse> {
    return this.get<SessionDetailResponse>(
      `/api/conversations/sessions/${sessionId}`,
      token
    );
  }

  /**
   * Create a new conversation session
   */
  async createSession(token: string, data: SessionCreate): Promise<SessionResponse> {
    return this.post<SessionResponse, SessionCreate>(
      '/api/conversations/sessions',
      token,
      data
    );
  }

  /**
   * Update session (title, status, or profile)
   */
  async updateSession(
    token: string,
    sessionId: string,
    data: SessionUpdate
  ): Promise<SessionResponse> {
    return this.patch<SessionResponse, SessionUpdate>(
      `/api/conversations/sessions/${sessionId}`,
      token,
      data
    );
  }

  /**
   * Delete a conversation session
   */
  async deleteSession(token: string, sessionId: string): Promise<void> {
    return this.delete<void>(`/api/conversations/sessions/${sessionId}`, token);
  }

  /**
   * Send a message and get AI response (non-streaming)
   */
  async sendMessage(
    token: string,
    sessionId: string,
    data: MessageCreate
  ): Promise<MessagePairResponse> {
    return this.post<MessagePairResponse, MessageCreate>(
      `/api/conversations/sessions/${sessionId}/messages`,
      token,
      data
    );
  }

  /**
   * Generate initial recommendation for session (non-streaming)
   */
  async generateRecommendation(
    token: string,
    sessionId: string
  ): Promise<RecommendationGenerationResponse> {
    return this.post<RecommendationGenerationResponse>(
      `/api/conversations/sessions/${sessionId}/recommend`,
      token
    );
  }

  /**
   * Archive a session
   */
  async archiveSession(token: string, sessionId: string): Promise<SessionResponse> {
    return this.updateSession(token, sessionId, { status: 'archived' });
  }

  /**
   * Restore an archived session
   */
  async restoreSession(token: string, sessionId: string): Promise<SessionResponse> {
    return this.updateSession(token, sessionId, { status: 'active' });
  }

  /**
   * Attach a profile to a session
   */
  async attachProfile(
    token: string,
    sessionId: string,
    profileId: string
  ): Promise<SessionResponse> {
    return this.updateSession(token, sessionId, { profile_id: profileId });
  }

  /**
   * Detach profile from a session
   */
  async detachProfile(token: string, sessionId: string): Promise<SessionResponse> {
    return this.updateSession(token, sessionId, { profile_id: null });
  }
}
