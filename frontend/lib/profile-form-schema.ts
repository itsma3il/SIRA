import { z } from "zod"

import type { ProfileFormData } from "@/lib/profile-form-types"

const optionalNumber = (schema: z.ZodNumber) =>
  z.union([schema, z.literal("")]).optional()

const optionalString = z.union([z.string().max(500), z.literal("")]).optional()

export const subjectGradeSchema = z.object({
  subject_name: z.string().min(1, "Subject name is required"),
  grade: optionalNumber(z.number().min(0).max(100)),
  weight: optionalNumber(z.number().min(0)),
})

export const academicRecordSchema = z.object({
  current_status: optionalString,
  current_institution: optionalString,
  current_field: optionalString,
  gpa: optionalNumber(z.number().min(0).max(20)),
  transcript_url: optionalString,
  language_preference: optionalString,
  subject_grades: z.array(subjectGradeSchema),
})

export const preferencesSchema = z
  .object({
    favorite_subjects: z.array(z.string().min(1)).default([]),
    disliked_subjects: z.array(z.string().min(1)).default([]),
    soft_skills: z.array(z.string().min(1)).default([]),
    hobbies: z.array(z.string().min(1)).default([]),
    geographic_preference: optionalString,
    budget_range_min: optionalNumber(z.number().min(0)),
    budget_range_max: optionalNumber(z.number().min(0)),
    career_goals: optionalString,
  })
  .superRefine((value, ctx) => {
    if (
      value.budget_range_min != null &&
      value.budget_range_max != null &&
      value.budget_range_min > value.budget_range_max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Budget min cannot exceed max",
        path: ["budget_range_max"],
      })
    }
  })

export const profileFormSchema = z.object({
  profile_name: z.string().min(1, "Profile name is required"),
  status: z.enum(["draft", "active", "archived"]),
  academic_record: academicRecordSchema,
  preferences: preferencesSchema,
})

export const profileStepSchemas = [
  z.object({
    profile_name: profileFormSchema.shape.profile_name,
    status: profileFormSchema.shape.status,
  }),
  z.object({
    academic_record: academicRecordSchema,
  }),
  z.object({
    preferences: preferencesSchema,
  }),
  z.object({}),
]

export const sanitizeProfileFormData = (data: ProfileFormData) => {
  const subject_grades = data.academic_record.subject_grades.filter((grade) => {
    const hasSubject = grade.subject_name.trim().length > 0
    const hasGrade = grade.grade !== "" && grade.grade !== undefined
    const hasWeight = grade.weight !== "" && grade.weight !== undefined
    return hasSubject || hasGrade || hasWeight
  })

  return {
    ...data,
    academic_record: {
      ...data.academic_record,
      subject_grades,
    },
  }
}
