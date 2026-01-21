import type { ProfileStatus } from "@/lib/profile-form-types"

export type SubjectGradeResponse = {
  id: string
  academic_record_id: string
  subject_name?: string | null
  grade?: number | null
  weight?: number | null
}

export type AcademicRecordResponse = {
  id: string
  profile_id: string
  current_status?: string | null
  current_institution?: string | null
  current_field?: string | null
  gpa?: number | null
  transcript_url?: string | null
  language_preference?: string | null
  created_at: string
  subject_grades: SubjectGradeResponse[]
}

export type StudentPreferencesResponse = {
  id: string
  profile_id: string
  favorite_subjects?: string[] | null
  disliked_subjects?: string[] | null
  soft_skills?: string[] | null
  hobbies?: string[] | null
  geographic_preference?: string | null
  budget_range_min?: number | null
  budget_range_max?: number | null
  career_goals?: string | null
}

export type ProfileResponse = {
  id: string
  user_id: string
  profile_name: string
  status: ProfileStatus
  draft_payload?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  academic_record?: AcademicRecordResponse | null
  preferences?: StudentPreferencesResponse | null
}

export type ProfileListResponse = {
  id: string
  user_id: string
  profile_name: string
  status: ProfileStatus
  created_at: string
  updated_at: string
}

export type SubjectGradePayload = {
  subject_name: string
  grade?: number
  weight?: number
}

export type AcademicRecordPayload = {
  current_status?: string
  current_institution?: string
  current_field?: string
  gpa?: number
  transcript_url?: string
  language_preference?: string
  subject_grades?: SubjectGradePayload[]
}

export type StudentPreferencesPayload = {
  favorite_subjects?: string[]
  disliked_subjects?: string[]
  soft_skills?: string[]
  hobbies?: string[]
  geographic_preference?: string
  budget_range_min?: number
  budget_range_max?: number
  career_goals?: string
}

export type ProfileCreatePayload = {
  profile_name: string
  status: ProfileStatus
  draft_payload?: Record<string, unknown> | null
  academic_record?: AcademicRecordPayload
  preferences?: StudentPreferencesPayload
}

export type ProfileUpdatePayload = Partial<ProfileCreatePayload>

export type ProfileStatusPayload = {
  status: ProfileStatus
}
