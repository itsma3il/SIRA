"use client"

import type { ProfileStepProps, StudentPreferencesForm } from "@/lib/profile-form-types"
import { FancyMultiSelect, type MultiSelectOption } from "@/components/fancy-multi-select"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const toOption = (label: string): MultiSelectOption => ({
  label,
  value: label.toLowerCase().replace(/\s+/g, "-"),
})

const mergeOptions = (base: string[], current?: string[]) => {
  const merged = new Set([...(current ?? []), ...base])
  return Array.from(merged).map((item) => toOption(item))
}

const subjectsOptions = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "Literature",
  "History",
]

const softSkillsOptions = [
  "Communication",
  "Leadership",
  "Problem Solving",
  "Critical Thinking",
  "Teamwork",
  "Creativity",
  "Time Management",
]

const hobbiesOptions = [
  "Robotics",
  "Coding",
  "Reading",
  "Chess",
  "Music",
  "Sports",
  "Art",
]

const geographyOptions = [
  "Casablanca",
  "Rabat",
  "Marrakesh",
  "Tangier",
  "Fes",
  "Agadir",
]

const parseSelection = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(toOption)

const joinSelection = (items: MultiSelectOption[]) =>
  items.map((item) => item.label).join(", ")

export function ProfileStepPreferences({
  value,
  onChange,
  disabled = false,
}: ProfileStepProps<StudentPreferencesForm>) {
  return (
    <Card className="p-4">
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="favorite_subjects">Favorite subjects</Label>
          <FancyMultiSelect
            options={mergeOptions(subjectsOptions, value.favorite_subjects)}
            value={(value.favorite_subjects ?? []).map(toOption)}
            onChange={(nextValue) =>
              onChange({
                ...value,
                favorite_subjects: nextValue.map((item) => item.label),
              })
            }
            placeholder="Add favorite subjects"
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="disliked_subjects">Disliked subjects</Label>
          <FancyMultiSelect
            options={mergeOptions(subjectsOptions, value.disliked_subjects)}
            value={(value.disliked_subjects ?? []).map(toOption)}
            onChange={(nextValue) =>
              onChange({
                ...value,
                disliked_subjects: nextValue.map((item) => item.label),
              })
            }
            placeholder="Add disliked subjects"
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="soft_skills">Soft skills</Label>
          <FancyMultiSelect
            options={mergeOptions(softSkillsOptions, value.soft_skills)}
            value={(value.soft_skills ?? []).map(toOption)}
            onChange={(nextValue) =>
              onChange({
                ...value,
                soft_skills: nextValue.map((item) => item.label),
              })
            }
            placeholder="Add soft skills"
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="hobbies">Hobbies</Label>
          <FancyMultiSelect
            options={mergeOptions(hobbiesOptions, value.hobbies)}
            value={(value.hobbies ?? []).map(toOption)}
            onChange={(nextValue) =>
              onChange({
                ...value,
                hobbies: nextValue.map((item) => item.label),
              })
            }
            placeholder="Add hobbies"
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="geographic_preference">Geographic preference</Label>
          <FancyMultiSelect
            options={mergeOptions(geographyOptions, value.geographic_preference)}
            value={parseSelection(value.geographic_preference)}
            onChange={(nextValue) =>
              onChange({
                ...value,
                geographic_preference: joinSelection(nextValue),
              })
            }
            placeholder="Add locations"
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="budget_range_min">Budget range (min)</Label>
          <Input
            id="budget_range_min"
            type="number"
            min={0}
            placeholder="e.g., 2000"
            value={value.budget_range_min ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                budget_range_min:
                  event.target.value === "" ? "" : Number(event.target.value),
              })
            }
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="budget_range_max">Budget range (max)</Label>
          <Input
            id="budget_range_max"
            type="number"
            min={0}
            placeholder="e.g., 6000"
            value={value.budget_range_max ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                budget_range_max:
                  event.target.value === "" ? "" : Number(event.target.value),
              })
            }
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="career_goals">Career goals</Label>
          <Textarea
            id="career_goals"
            placeholder="Describe career goals, preferred roles, or industries."
            value={value.career_goals ?? ""}
            onChange={(event) =>
              onChange({ ...value, career_goals: event.target.value })
            }
            disabled={disabled}
          />
        </div>
      </div>
    </Card>
  )
}
