import type {
  ProfileCreatePayload,
  ProfileListResponse,
  ProfileResponse,
  ProfileStatusPayload,
  ProfileUpdatePayload,
} from "@/lib/profile-api-types"
import type { TranscriptUploadResult } from "@/lib/profile-form-types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

const request = async <T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let message = `Request failed with ${response.status}`
    try {
      const data = await response.json()
      if (data?.detail) message = data.detail
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const profilesApi = {
  list: async (token: string) =>
    request<ProfileListResponse[]>("/api/profiles", token),
  get: async (token: string, profileId: string) =>
    request<ProfileResponse>(`/api/profiles/${profileId}`, token),
  create: async (token: string, payload: ProfileCreatePayload) =>
    request<ProfileResponse>("/api/profiles", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: async (token: string, profileId: string, payload: ProfileUpdatePayload) =>
    request<ProfileResponse>(`/api/profiles/${profileId}`, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  delete: async (token: string, profileId: string) =>
    request<void>(`/api/profiles/${profileId}`, token, {
      method: "DELETE",
    }),
  changeStatus: async (
    token: string,
    profileId: string,
    payload: ProfileStatusPayload
  ) =>
    request<ProfileResponse>(`/api/profiles/${profileId}/status`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
}

export const uploadTranscript = async (
  token: string,
  file: File
): Promise<TranscriptUploadResult> => {
  const formData = new FormData()
  formData.append("file", file)

  return request<TranscriptUploadResult>("/api/upload/transcript", token, {
    method: "POST",
    body: formData,
  })
}

export const deleteTranscript = async (token: string, filename: string) => {
  return request<void>(`/api/upload/files/${filename}`, token, {
    method: "DELETE",
  })
}
