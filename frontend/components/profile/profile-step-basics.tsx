"use client"

import type { ProfileStatus, ProfileStepProps } from "@/lib/profile-form-types"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ProfileBasicsValue = {
  profile_name: string
  status: ProfileStatus
}

export function ProfileStepBasics({
  value,
  onChange,
  disabled = false,
}: ProfileStepProps<ProfileBasicsValue>) {
  return (
    <Card className="p-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="profile_name">Profile name</Label>
          <Input
            id="profile_name"
            placeholder="e.g., Engineering Track"
            value={value.profile_name}
            onChange={(event) =>
              onChange({ ...value, profile_name: event.target.value })
            }
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Give this profile a descriptive name for easy identification.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={value.status}
            onValueChange={(nextValue) =>
              onChange({ ...value, status: nextValue as ProfileStatus })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Draft profiles can be saved without completing all fields.
          </p>
        </div>
      </div>
    </Card>
  )
}
