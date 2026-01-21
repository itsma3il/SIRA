import type {
  ProfileFormData,
  TranscriptUploadResult,
} from "@/lib/profile-form-types"
import type {
  ProfileResponse,
  ProfileCreatePayload,
  ProfileUpdatePayload,
  AcademicRecordPayload,
  StudentPreferencesPayload,
} from "@/lib/profile-api-types"

const normalizeString = (value?: string | null) => {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeNumber = (value?: number | "" | null) => {
  if (value === "" || value == null) return undefined
  return value
}

export const buildTranscriptUploadFromUrl = (
  url?: string | null
): TranscriptUploadResult | null => {
  if (!url) return null
  const filename = url.split("/").pop()
  if (!filename) return null

  return {
    filename,
    url,
    original_filename: filename,
    content_type: "application/pdf",
  }
}

export const mapProfileResponseToFormData = (
  profile: ProfileResponse
): ProfileFormData => {
  return {
    profile_name: profile.profile_name ?? "",
    status: profile.status ?? "draft",
    academic_record: {
      current_status: profile.academic_record?.current_status ?? "",
      current_institution: profile.academic_record?.current_institution ?? "",
      current_field: profile.academic_record?.current_field ?? "",
      gpa: profile.academic_record?.gpa ?? "",
      transcript_url: profile.academic_record?.transcript_url ?? "",
      language_preference: profile.academic_record?.language_preference ?? "",
      subject_grades:
        profile.academic_record?.subject_grades?.map((grade) => ({
          id: grade.id,
          subject_name: grade.subject_name ?? "",
          grade: grade.grade ?? "",
          weight: grade.weight ?? "",
        })) ?? [],
    },
    preferences: {
      favorite_subjects: profile.preferences?.favorite_subjects ?? [],
      disliked_subjects: profile.preferences?.disliked_subjects ?? [],
      soft_skills: profile.preferences?.soft_skills ?? [],
      hobbies: profile.preferences?.hobbies ?? [],
      geographic_preference: profile.preferences?.geographic_preference ?? "",
      budget_range_min: profile.preferences?.budget_range_min ?? "",
      budget_range_max: profile.preferences?.budget_range_max ?? "",
      career_goals: profile.preferences?.career_goals ?? "",
    },
  }
}

const buildAcademicPayload = (
  data: ProfileFormData
): AcademicRecordPayload | undefined => {
  const subject_grades = data.academic_record.subject_grades
    .filter((grade) => grade.subject_name.trim().length > 0)
    .map((grade) => ({
      subject_name: grade.subject_name.trim(),
      grade: normalizeNumber(grade.grade),
      weight: normalizeNumber(grade.weight),
    }))

  const payload: AcademicRecordPayload = {
    current_status: normalizeString(data.academic_record.current_status),
    current_institution: normalizeString(data.academic_record.current_institution),
    current_field: normalizeString(data.academic_record.current_field),
    gpa: normalizeNumber(data.academic_record.gpa),
    transcript_url: normalizeString(data.academic_record.transcript_url),
    language_preference: normalizeString(data.academic_record.language_preference),
    subject_grades,
  }

  return payload
}

const buildPreferencesPayload = (
  data: ProfileFormData
): StudentPreferencesPayload => ({
  favorite_subjects: (data.preferences.favorite_subjects ?? []).filter(Boolean),
  disliked_subjects: (data.preferences.disliked_subjects ?? []).filter(Boolean),
  soft_skills: (data.preferences.soft_skills ?? []).filter(Boolean),
  hobbies: (data.preferences.hobbies ?? []).filter(Boolean),
  geographic_preference: normalizeString(data.preferences.geographic_preference),
  budget_range_min: normalizeNumber(data.preferences.budget_range_min),
  budget_range_max: normalizeNumber(data.preferences.budget_range_max),
  career_goals: normalizeString(data.preferences.career_goals),
})

export const buildProfileCreatePayload = (
  data: ProfileFormData
): ProfileCreatePayload => ({
  profile_name: data.profile_name.trim(),
  status: data.status,
  academic_record: buildAcademicPayload(data),
  preferences: buildPreferencesPayload(data),
})

export const buildProfileUpdatePayload = (
  data: ProfileFormData
): ProfileUpdatePayload => ({
  profile_name: data.profile_name.trim(),
  status: data.status,
  academic_record: buildAcademicPayload(data),
  preferences: buildPreferencesPayload(data),
})
