"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useStore } from "@tanstack/react-store"

import type {
    ProfileFormData,
    SubjectGradeForm,
    TranscriptUploadResult,
} from "@/lib/profile-form-types"
import {
    profileFormSchema,
    profileStepSchemas,
    sanitizeProfileFormData,
} from "@/lib/profile-form-schema"
import {
    createEmptyProfileFormData,
    useProfileWizardStore,
} from "@/stores/profile-wizard-store"
import { ProfileStepBasics } from "@/components/profile/profile-step-basics"
import { ProfileStepAcademic } from "@/components/profile/profile-step-academic"
import { ProfileStepPreferences } from "@/components/profile/profile-step-preferences"
import { ProfileStepReview } from "@/components/profile/profile-step-review"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const steps = [
    {
        id: "basics",
        label: "Basics",
        description: "Profile name and status",
    },
    {
        id: "academic",
        label: "Academic",
        description: "Education background and grades",
    },
    {
        id: "preferences",
        label: "Preferences",
        description: "Interests, skills, and goals",
    },
    {
        id: "review",
        label: "Review",
        description: "Confirm and submit",
    },
]

export type ProfileWizardProps = {
    onSubmit?: (data: ProfileFormData) => Promise<void> | void
    onUploadTranscript?: (file: File) => Promise<TranscriptUploadResult>
    onRemoveTranscript?: (value: TranscriptUploadResult | null) => Promise<void> | void
}

const formatTime = (timestamp: number | null) => {
    if (!timestamp) return ""
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })
}

export function ProfileWizard({
    onSubmit,
    onUploadTranscript,
    onRemoveTranscript,
}: ProfileWizardProps) {
    const {
        currentStep,
        data,
        transcriptUpload,
        uploadError,
        lastSavedAt,
        hasHydrated,
        setCurrentStep,
        nextStep,
        previousStep,
        setData,
        setTranscriptUpload,
        setUploadError,
        setLastSavedAt,
        reset,
    } = useProfileWizardStore()

    const [stepErrors, setStepErrors] = React.useState<string[]>([])
    const [uploading, setUploading] = React.useState(false)

    const form = useForm({
        defaultValues: data,
        validators: {
            onChange: profileFormSchema,
        },
        onSubmit: async ({ value }) => {
            const sanitized = sanitizeProfileFormData(value)
            await onSubmit?.(sanitized)
        },
    })

    const formValues = useStore(form.store, (state) => state.values) as ProfileFormData
    const hasInitialized = React.useRef(false)

    React.useEffect(() => {
        if (!hasHydrated) return
        if (hasInitialized.current) return
        form.reset(data)
        hasInitialized.current = true
    }, [data, form, hasHydrated])

    React.useEffect(() => {
        if (!hasHydrated) return
        const timeout = window.setTimeout(() => {
            setData(formValues)
            setLastSavedAt(Date.now())
        }, 400)

        return () => window.clearTimeout(timeout)
    }, [formValues, hasHydrated, setData, setLastSavedAt])

    const progressValue = ((currentStep + 1) / steps.length) * 100

    const handleNext = () => {
        const sanitized = sanitizeProfileFormData(form.state.values)
        form.setFieldValue(
            "academic_record.subject_grades",
            sanitized.academic_record.subject_grades
        )

        const stepSchema = profileStepSchemas[currentStep]
        const result = stepSchema.safeParse(sanitized)

        if (!result.success) {
            const messages = result.error.issues.map((issue) => issue.message)
            setStepErrors(messages)
            return
        }

        setStepErrors([])
        nextStep()
    }

    const handlePrevious = () => {
        setStepErrors([])
        previousStep()
    }

    const handleSubmit = async () => {
        const sanitized = sanitizeProfileFormData(form.state.values)
        form.setFieldValue(
            "academic_record.subject_grades",
            sanitized.academic_record.subject_grades
        )

        const result = profileFormSchema.safeParse(sanitized)
        if (!result.success) {
            const messages = result.error.issues.map((issue) => issue.message)
            setStepErrors(messages)
            return
        }

        setStepErrors([])
        await onSubmit?.(sanitized)
    }

    const handleUploadTranscript = async (file: File) => {
        setUploading(true)
        setUploadError(null)

        try {
            if (onUploadTranscript) {
                const result = await onUploadTranscript(file)
                setTranscriptUpload(result)
                form.setFieldValue("academic_record.transcript_url", result.url)
                return
            }

            const localResult: TranscriptUploadResult = {
                filename: `local-${Date.now()}`,
                url: URL.createObjectURL(file),
                original_filename: file.name,
                content_type: file.type,
            }
            setTranscriptUpload(localResult)
            form.setFieldValue("academic_record.transcript_url", localResult.url)
        } catch (error) {
            setUploadError("Unable to upload transcript. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveTranscript = async () => {
        const current = transcriptUpload
        setTranscriptUpload(null)
        form.setFieldValue("academic_record.transcript_url", "")

        if (!current) return

        if (onRemoveTranscript) {
            await onRemoveTranscript(current)
        }
    }

    const handleResetDraft = () => {
        reset()
        form.reset(createEmptyProfileFormData())
    }

    if (!hasHydrated) {
        return (
            <Card className="p-8">
                <p className="text-sm text-muted-foreground">
                    Loading your draft...
                </p>
            </Card>
        )
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
            }}
            className="grid gap-4"
        >
            <Card className="p-4">
                <div className="grid gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold">Profile setup wizard</p>
                            <p className="text-xs text-muted-foreground">
                                Step {currentStep + 1} of {steps.length} · {steps[currentStep].label}
                            </p>
                        </div>
                        {lastSavedAt ? (
                            <p className="text-xs text-muted-foreground">
                                Draft saved at {formatTime(lastSavedAt)}
                            </p>
                        ) : null}
                    </div>

                    <Progress value={progressValue} />

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {steps.map((step, index) => (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => setCurrentStep(index)}
                                className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${index === currentStep
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground hover:bg-muted"
                                    }`}
                            >
                                <p className="text-sm font-medium text-foreground">
                                    {step.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {step.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {stepErrors.length > 0 ? (
                <Card className="border-destructive/40 bg-destructive/5 p-4">
                    <p className="text-sm font-semibold text-destructive">
                        Please review the highlighted fields:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-destructive">
                        {stepErrors.map((message, index) => (
                            <li key={`${message}-${index}`}>{message}</li>
                        ))}
                    </ul>
                </Card>
            ) : null}

            {currentStep === 0 ? (
                <ProfileStepBasics
                    value={{
                        profile_name: formValues.profile_name,
                        status: formValues.status,
                    }}
                    onChange={(nextValue) => {
                        form.setFieldValue("profile_name", nextValue.profile_name)
                        form.setFieldValue("status", nextValue.status)
                    }}
                />
            ) : null}

            {currentStep === 1 ? (
                <ProfileStepAcademic
                    value={formValues.academic_record}
                    onChange={(nextValue) =>
                        form.setFieldValue("academic_record", nextValue)
                    }
                    onAddSubjectGrade={() => {
                        const newGrade: SubjectGradeForm = { subject_name: "", grade: "" }
                        const nextGrades: SubjectGradeForm[] = [
                            ...formValues.academic_record.subject_grades,
                            newGrade,
                        ]
                        form.setFieldValue("academic_record.subject_grades", nextGrades)
                    }}
                    onUpdateSubjectGrade={(index, nextValue) => {
                        const nextGrades = [...formValues.academic_record.subject_grades]
                        nextGrades[index] = nextValue
                        form.setFieldValue("academic_record.subject_grades", nextGrades)
                    }}
                    onRemoveSubjectGrade={(index) => {
                        const nextGrades = formValues.academic_record.subject_grades.filter(
                            (_, gradeIndex) => gradeIndex !== index
                        )
                        form.setFieldValue("academic_record.subject_grades", nextGrades)
                    }}
                    transcriptUpload={transcriptUpload}
                    onUploadTranscript={handleUploadTranscript}
                    onRemoveTranscript={handleRemoveTranscript}
                    uploadError={uploadError ?? undefined}
                    uploading={uploading}
                />
            ) : null}

            {currentStep === 2 ? (
                <ProfileStepPreferences
                    value={formValues.preferences}
                    onChange={(nextValue) =>
                        form.setFieldValue("preferences", nextValue)
                    }
                />
            ) : null}

            {currentStep === 3 ? <ProfileStepReview value={formValues} /> : null}

            <Card className="flex flex-row items-center justify-between gap-3 p-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                >
                    Back
                </Button>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={handleResetDraft}>
                        Reset
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSubmit}
                        disabled={currentStep !== steps.length - 1}
                    >
                        Save
                    </Button>
                </div>

                <Button
                    type="button"
                    onClick={handleNext}
                    disabled={currentStep === steps.length - 1}
                >
                    Next
                </Button>
            </Card>
        </form>
    )
}
