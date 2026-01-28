/**
 * Profiles API Service
 * 
 * Provides methods for managing user profiles including academic records,
 * preferences, and transcript uploads.
 */

import { BaseApiService } from './base.service';
import type {
  ProfileCreatePayload,
  ProfileListResponse,
  ProfileResponse,
  ProfileStatusPayload,
  ProfileUpdatePayload,
} from '@/lib/profile-api-types';
import type { TranscriptUploadResult } from '@/lib/profile-form-types';

export class ProfilesService extends BaseApiService {
  /**
   * Get all profiles for the authenticated user
   */
  async list(token: string): Promise<ProfileListResponse[]> {
    return this.get<ProfileListResponse[]>('/api/profiles', token);
  }

  /**
   * Get a specific profile by ID
   */
  async getById(token: string, profileId: string): Promise<ProfileResponse> {
    return this.get<ProfileResponse>(`/api/profiles/${profileId}`, token);
  }

  /**
   * Create a new profile
   */
  async create(token: string, payload: ProfileCreatePayload): Promise<ProfileResponse> {
    return this.post<ProfileResponse, ProfileCreatePayload>(
      '/api/profiles',
      token,
      payload
    );
  }

  /**
   * Update an existing profile
   */
  async update(
    token: string,
    profileId: string,
    payload: ProfileUpdatePayload
  ): Promise<ProfileResponse> {
    return this.put<ProfileResponse, ProfileUpdatePayload>(
      `/api/profiles/${profileId}`,
      token,
      payload
    );
  }

  /**
   * Delete a profile
   */
  async deleteById(token: string, profileId: string): Promise<void> {
    return this.delete<void>(`/api/profiles/${profileId}`, token);
  }

  /**
   * Change profile status (draft, active, archived)
   */
  async changeStatus(
    token: string,
    profileId: string,
    payload: ProfileStatusPayload
  ): Promise<ProfileResponse> {
    return this.patch<ProfileResponse, ProfileStatusPayload>(
      `/api/profiles/${profileId}/status`,
      token,
      payload
    );
  }

  /**
   * Upload transcript file
   */
  async uploadTranscript(token: string, file: File): Promise<TranscriptUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.upload<TranscriptUploadResult>(
      '/api/upload/transcript',
      token,
      formData
    );
  }

  /**
   * Delete uploaded transcript file
   */
  async deleteTranscript(token: string, filename: string): Promise<void> {
    return this.delete<void>(`/api/upload/files/${filename}`, token);
  }
}
