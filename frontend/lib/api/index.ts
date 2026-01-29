/**
 * Unified API Client
 * 
 * Single entry point for all API services in the application.
 * Provides type-safe, object-oriented access to backend endpoints.
 * 
 * @example
 * ```typescript
 * import { api } from '@/lib/api';
 * 
 * // Use anywhere in the app
 * const profiles = await api.profiles.list(token);
 * const session = await api.conversations.getSession(token, sessionId);
 * const rec = await api.recommendations.generate(token, { profile_id, session_id });
 * ```
 */

import { ProfilesService } from './profiles.service';
import { ConversationsService } from './conversations.service';
import { RecommendationsService } from './recommendations.service';
import { AdminService } from './admin.service';

/**
 * Unified API client with all services
 */
export const api = {
  profiles: new ProfilesService(),
  conversations: new ConversationsService(),
  recommendations: new RecommendationsService(),
  admin: new AdminService(),
} as const;

/**
 * Re-export services for direct instantiation if needed
 */
export { ProfilesService, ConversationsService, RecommendationsService, AdminService };

/**
 * Re-export base classes for custom extensions
 */
export { BaseApiService, ApiException } from './base.service';
export type { ApiError } from './base.service';

/**
 * Re-export admin types for convenience
 */
export type {
  DashboardMetrics,
  ProfileListItem,
  SessionListItem,
  RecommendationListItem,
  RecommendationAnalytics,
  ProgramCount,
  ProgramInfo,
} from './admin.service';
