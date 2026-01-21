"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type {
  ProfileFormData,
  TranscriptUploadResult,
} from "@/lib/profile-form-types"

export const createEmptyProfileFormData = (): ProfileFormData => ({
  profile_name: "",
  status: "draft",
  academic_record: {
    current_status: "",
    current_institution: "",
    current_field: "",
    gpa: "",
    transcript_url: "",
    language_preference: "",
    subject_grades: [],
  },
  preferences: {
    favorite_subjects: [],
    disliked_subjects: [],
    soft_skills: [],
    hobbies: [],
    geographic_preference: "",
    budget_range_min: "",
    budget_range_max: "",
    career_goals: "",
  },
})

type ProfileWizardState = {
  currentStep: number
  data: ProfileFormData
  transcriptUpload: TranscriptUploadResult | null
  uploadError: string | null
  lastSavedAt: number | null
  hasHydrated: boolean
  setCurrentStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  setData: (data: ProfileFormData) => void
  updateData: (partial: Partial<ProfileFormData>) => void
  setTranscriptUpload: (value: TranscriptUploadResult | null) => void
  setUploadError: (error: string | null) => void
  setLastSavedAt: (timestamp: number | null) => void
  reset: () => void
  setHasHydrated: (value: boolean) => void
}

export const useProfileWizardStore = create<ProfileWizardState>()(
  persist(
    (set) => ({
      currentStep: 0,
      data: createEmptyProfileFormData(),
      transcriptUpload: null,
      uploadError: null,
      lastSavedAt: null,
      hasHydrated: false,
      setCurrentStep: (step) =>
        set({ currentStep: Math.max(0, Math.min(step, 3)) }),
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 3),
        })),
      previousStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),
      setData: (data) => set({ data }),
      updateData: (partial) =>
        set((state) => ({ data: { ...state.data, ...partial } })),
      setTranscriptUpload: (value) => set({ transcriptUpload: value }),
      setUploadError: (error) => set({ uploadError: error }),
      setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),
      reset: () =>
        set({
          currentStep: 0,
          data: createEmptyProfileFormData(),
          transcriptUpload: null,
          uploadError: null,
          lastSavedAt: null,
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "sira-profile-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
        transcriptUpload: state.transcriptUpload,
        lastSavedAt: state.lastSavedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
