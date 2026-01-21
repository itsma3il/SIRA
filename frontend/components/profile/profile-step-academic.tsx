"use client"

import type {
  AcademicRecordForm,
  ProfileStepProps,
  SubjectGradeForm,
  TranscriptUploadResult,
} from "@/lib/profile-form-types"
import { FancyMultiSelect, type MultiSelectOption } from "@/components/fancy-multi-select"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TranscriptUploadField } from "@/components/profile/transcript-upload"

const toOption = (label: string): MultiSelectOption => ({
  label,
  value: label.toLowerCase().replace(/\s+/g, "-"),
})

const mergeOptions = (base: string[], current?: string) => {
  const currentItems = current
    ? current.split(",").map((item) => item.trim()).filter(Boolean)
    : []
  const merged = new Set([...base, ...currentItems])
  return Array.from(merged).map((item) => toOption(item))
}

const parseSelection = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(toOption)

const joinSelection = (items: MultiSelectOption[]) =>
  items.map((item) => item.label).join(", ")

const statusOptions = [
  "High School Senior",
  "High School Graduate",
  "Undergraduate",
  "Graduate",
  "Career Switcher",
]

const fieldOptions = [
  "Sciences",
  "Mathematics",
  "Computer Science",
  "Economics",
  "Literature",
  "Engineering",
]

const languageOptions = ["French", "English", "Arabic", "Spanish"]

const subjectOptions = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "Literature",
  "History",
]

export type ProfileStepAcademicProps = ProfileStepProps<AcademicRecordForm> & {
  onAddSubjectGrade: () => void
  onUpdateSubjectGrade: (index: number, value: SubjectGradeForm) => void
  onRemoveSubjectGrade: (index: number) => void
  transcriptUpload?: TranscriptUploadResult | null
  onUploadTranscript: (file: File) => Promise<void> | void
  onRemoveTranscript: () => void
  uploadError?: string
  uploading?: boolean
}

export function ProfileStepAcademic({
  value,
  onChange,
  disabled = false,
  onAddSubjectGrade,
  onUpdateSubjectGrade,
  onRemoveSubjectGrade,
  transcriptUpload,
  onUploadTranscript,
  onRemoveTranscript,
  uploadError,
  uploading = false,
}: ProfileStepAcademicProps) {
  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="current_status">Current status</Label>
            <FancyMultiSelect
              options={mergeOptions(statusOptions, value.current_status)}
              value={parseSelection(value.current_status)}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  current_status: joinSelection(nextValue),
                })
              }
              placeholder="Select status"
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="current_institution">Current institution</Label>
            <Input
              id="current_institution"
              placeholder="e.g., Lycée Ibn Rochd"
              value={value.current_institution ?? ""}
              onChange={(event) =>
                onChange({ ...value, current_institution: event.target.value })
              }
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="current_field">Current field</Label>
            <FancyMultiSelect
              options={mergeOptions(fieldOptions, value.current_field)}
              value={parseSelection(value.current_field)}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  current_field: joinSelection(nextValue),
                })
              }
              placeholder="Select field(s)"
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gpa">GPA (0-20 scale)</Label>
            <Input
              id="gpa"
              type="number"
              min={0}
              max={20}
              step={0.1}
              placeholder="e.g., 15.5"
              value={value.gpa ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  gpa: event.target.value === "" ? "" : Number(event.target.value),
                })
              }
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="language_preference">Language preference</Label>
            <FancyMultiSelect
              options={mergeOptions(languageOptions, value.language_preference)}
              value={parseSelection(value.language_preference)}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  language_preference: joinSelection(nextValue),
                })
              }
              placeholder="Select language(s)"
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transcript_url">Transcript URL (optional)</Label>
            <Input
              id="transcript_url"
              placeholder="https://..."
              value={value.transcript_url ?? ""}
              onChange={(event) =>
                onChange({ ...value, transcript_url: event.target.value })
              }
              disabled={disabled}
            />
          </div>
        </div>
      </Card>

      <TranscriptUploadField
        value={transcriptUpload}
        onUpload={onUploadTranscript}
        onRemove={onRemoveTranscript}
        uploading={uploading}
        error={uploadError}
        disabled={disabled}
      />

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Subject grades</p>
            <p className="text-xs text-muted-foreground">
              Add subjects and grades to refine recommendations.
            </p>
          </div>
          <Button type="button" onClick={onAddSubjectGrade} disabled={disabled}>
            Add subject
          </Button>
        </div>

        <div className="mt-4 grid gap-4">
          {value.subject_grades.map((grade, index) => (
            <div
              key={grade.id ?? `${grade.subject_name}-${index}`}
              className="grid gap-3 rounded-md border border-border bg-muted/30 p-4"
            >
              <div className="grid gap-2">
                <Label htmlFor={`subject_name_${index}`}>Subject name</Label>
                <FancyMultiSelect
                  options={mergeOptions(subjectOptions, grade.subject_name)}
                  value={parseSelection(grade.subject_name)}
                  onChange={(nextValue) =>
                    onUpdateSubjectGrade(index, {
                      ...grade,
                      subject_name: joinSelection(nextValue),
                    })
                  }
                  placeholder="Add subject(s)"
                  disabled={disabled}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`subject_grade_${index}`}>Grade (0-100)</Label>
                <Input
                  id={`subject_grade_${index}`}
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="e.g., 85"
                  value={grade.grade}
                  onChange={(event) =>
                    onUpdateSubjectGrade(index, {
                      ...grade,
                      grade:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    })
                  }
                  disabled={disabled}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`subject_weight_${index}`}>
                  Weight (credits)
                </Label>
                <Input
                  id={`subject_weight_${index}`}
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="e.g., 2"
                  value={grade.weight ?? ""}
                  onChange={(event) =>
                    onUpdateSubjectGrade(index, {
                      ...grade,
                      weight:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    })
                  }
                  disabled={disabled}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveSubjectGrade(index)}
                disabled={disabled}
                className="justify-self-start text-destructive"
              >
                Remove subject
              </Button>
            </div>
          ))}

          {value.subject_grades.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No subject grades yet. Add at least one to personalize results.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
