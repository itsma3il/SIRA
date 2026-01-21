"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import type { ProfileListResponse } from "@/lib/profile-api-types"
import { profilesApi } from "@/lib/profile-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusVariant = (status: ProfileListResponse["status"]) => {
  switch (status) {
    case "active":
      return "secondary"
    case "archived":
      return "outline"
    default:
      return "default"
  }
}

export default function ProfilesPage() {
  const { getToken, isLoaded } = useAuth()
  const [profiles, setProfiles] = React.useState<ProfileListResponse[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadProfiles = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        setError("Authentication required")
        return
      }
      const data = await profilesApi.list(token)
      setProfiles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profiles")
    } finally {
      setLoading(false)
    }
  }, [getToken])

  React.useEffect(() => {
    if (!isLoaded) return
    void loadProfiles()
  }, [isLoaded, loadProfiles])

  const handleDelete = async (profileId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this profile? This action cannot be undone."
    )
    if (!confirmDelete) return

    const token = await getToken()
    if (!token) return

    const previous = profiles
    setProfiles((current) => current.filter((item) => item.id !== profileId))

    try {
      await profilesApi.delete(token, profileId)
      toast.success("Profile deleted")
    } catch (err) {
      setProfiles(previous)
      toast.error(
        err instanceof Error ? err.message : "Unable to delete profile"
      )
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Profile management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage student profiles for recommendations.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/profiles/new">New profile</Link>
        </Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading profiles...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : profiles.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium">No profiles yet</p>
            <p className="text-xs text-muted-foreground">
              Create your first profile to begin receiving recommendations.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {profile.profile_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(profile.status)}>
                      {profile.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/profiles/${profile.id}`}>
                          View
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/dashboard/profiles/${profile.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(profile.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
