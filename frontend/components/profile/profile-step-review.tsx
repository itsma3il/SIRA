"use client"

import type { ProfileFormData } from "@/lib/profile-form-types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const renderList = (items?: string[]) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">Not provided</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
    </div>
  )
}

export type ProfileStepReviewProps = {
  value: ProfileFormData
}

export function ProfileStepReview({ value }: ProfileStepReviewProps) {
  return (
    <Card className="p-4">
      <div className="grid gap-4">
        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Profile summary</h3>
          <div className="grid gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {value.profile_name || "Not set"}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {value.status}
            </p>
          </div>
        </section>

        <Separator />

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold">Academic record</h3>
          <div className="grid gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {value.academic_record.current_status || "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Institution:</span>{" "}
              {value.academic_record.current_institution || "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Field:</span>{" "}
              {value.academic_record.current_field || "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">GPA:</span>{" "}
              {value.academic_record.gpa === "" || value.academic_record.gpa == null
                ? "Not provided"
                : value.academic_record.gpa}
            </p>
            <p>
              <span className="text-muted-foreground">Language:</span>{" "}
              {value.academic_record.language_preference || "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Transcript:</span>{" "}
              {value.academic_record.transcript_url || "Not uploaded"}
            </p>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Subject grades</p>
            {value.academic_record.subject_grades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not provided</p>
            ) : (
              <div className="grid gap-2">
                {value.academic_record.subject_grades.map((subject) => (
                  <div
                    key={`${subject.subject_name}-${subject.grade}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{subject.subject_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Grade: {subject.grade || "-"}
                        {subject.weight
                          ? ` · Weight: ${subject.weight}`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <Separator />

        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">Preferences</h3>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Favorite subjects</p>
            {renderList(value.preferences.favorite_subjects)}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Disliked subjects</p>
            {renderList(value.preferences.disliked_subjects)}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Soft skills</p>
            {renderList(value.preferences.soft_skills)}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Hobbies</p>
            {renderList(value.preferences.hobbies)}
          </div>

          <div className="grid gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Geographic preference:</span>{" "}
              {value.preferences.geographic_preference || "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Budget range:</span>{" "}
              {value.preferences.budget_range_min || value.preferences.budget_range_max
                ? `${value.preferences.budget_range_min ?? "-"} - ${
                    value.preferences.budget_range_max ?? "-"
                  }`
                : "Not provided"}
            </p>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Career goals</p>
            <p className="text-sm text-muted-foreground">
              {value.preferences.career_goals || "Not provided"}
            </p>
          </div>
        </section>
      </div>
    </Card>
  )
}
