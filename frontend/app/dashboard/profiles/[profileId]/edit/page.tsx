"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import type { ProfileFormData } from "@/lib/profile-form-types"
import type { ProfileResponse } from "@/lib/profile-api-types"
import {
  profilesApi,
  uploadTranscript,
  deleteTranscript,
} from "@/lib/profile-api"
import {
  buildProfileUpdatePayload,
  buildTranscriptUploadFromUrl,
  mapProfileResponseToFormData,
} from "@/lib/profile-mappers"
import { useProfileWizardStore } from "@/stores/profile-wizard-store"
import { ProfileWizard } from "@/components/profile/profile-wizard"
import { Card } from "@/components/ui/card"

export default function EditProfilePage() {
  const params = useParams<{ profileId: string }>()
  const profileId = params.profileId
  const router = useRouter()
  const { getToken, isLoaded } = useAuth()
  const [profile, setProfile] = React.useState<ProfileResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const {
    reset,
    setData,
    setTranscriptUpload,
    setCurrentStep,
  } = useProfileWizardStore()

  const loadProfile = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError("Authentication required")
        return
      }
      const data = await profilesApi.get(token, profileId)
      setProfile(data)

      const formData = mapProfileResponseToFormData(data)
      reset()
      setData(formData)
      setCurrentStep(0)
      setTranscriptUpload(buildTranscriptUploadFromUrl(data.academic_record?.transcript_url))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profile")
    } finally {
      setLoading(false)
    }
  }, [getToken, profileId, reset, setCurrentStep, setData, setTranscriptUpload])

  React.useEffect(() => {
    if (!isLoaded) return
    void loadProfile()
  }, [isLoaded, loadProfile])

  const handleSubmit = async (data: ProfileFormData) => {
    setError(null)
    const token = await getToken()
    if (!token) {
      setError("Authentication required")
      return
    }

    try {
      const payload = buildProfileUpdatePayload(data)
      const updated = await profilesApi.update(token, profileId, payload)
      toast.success("Profile updated")
      router.push(`/dashboard/profiles/${updated.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile")
      toast.error(
        err instanceof Error ? err.message : "Unable to update profile"
      )
    }
  }

  const handleUploadTranscript = async (file: File) => {
    const token = await getToken()
    if (!token) throw new Error("Authentication required")
    return uploadTranscript(token, file)
  }

  const handleRemoveTranscript = async (value: { filename: string } | null) => {
    const token = await getToken()
    if (!token || !value) return
    await deleteTranscript(token, value.filename)
    toast.success("Transcript removed")
  }

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </Card>
    )
  }

  if (error || !profile) {
    return (
      <Card className="p-4 text-sm text-destructive">
        {error ?? "Profile not found"}
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit profile</h1>
        <p className="text-sm text-muted-foreground">
          Update details for {profile.profile_name}.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </Card>
      ) : null}

      <ProfileWizard
        onSubmit={handleSubmit}
        onUploadTranscript={handleUploadTranscript}
        onRemoveTranscript={handleRemoveTranscript}
      />
    </div>
  )
}
