export type ProfileStatus = "draft" | "active" | "archived"

export type SubjectGradeForm = {
  id?: string
  subject_name: string
  grade?: number | "" | undefined
  weight?: number | "" | undefined
}

export type AcademicRecordForm = {
  current_status?: string
  current_institution?: string
  current_field?: string
  gpa?: number | "" | undefined
  transcript_url?: string
  language_preference?: string
  subject_grades: SubjectGradeForm[]
}

export type StudentPreferencesForm = {
  favorite_subjects?: string[]
  disliked_subjects?: string[]
  soft_skills?: string[]
  hobbies?: string[]
  geographic_preference?: string
  budget_range_min?: number | "" | undefined
  budget_range_max?: number | "" | undefined
  career_goals?: string
}

export type ProfileFormData = {
  profile_name: string
  status: ProfileStatus
  academic_record: AcademicRecordForm
  preferences: StudentPreferencesForm
}

export type ProfileStepProps<T> = {
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

export type TranscriptUploadResult = {
  filename: string
  url: string
  original_filename: string
  content_type: string
}
