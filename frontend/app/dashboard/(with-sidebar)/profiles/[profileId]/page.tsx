"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

import type { ProfileResponse } from "@/lib/profile-api-types";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const statusVariant = (status: ProfileResponse["status"]) => {
  switch (status) {
    case "active":
      return "secondary";
    case "archived":
      return "outline";
    default:
      return "default";
  }
};

export default function ProfileDetailPage() {
  const params = useParams<{ profileId: string }>();
  const profileId = params.profileId;
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [profile, setProfile] = React.useState<ProfileResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }
      const data = await api.profiles.getById(token, profileId);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, [getToken, profileId]);

  React.useEffect(() => {
    if (!isLoaded) return;
    void loadProfile();
  }, [isLoaded, loadProfile]);

  const handleDelete = async () => {
    if (!profile) return;
    const confirmDelete = window.confirm(
      "Delete this profile permanently? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const token = await getToken();
    if (!token) return;

    try {
      await api.profiles.deleteById(token, profile.id);
      toast.success("Profile deleted");
      router.push("/dashboard/profiles");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete profile");
    }
  };

  const handleStatusChange = async (status: ProfileResponse["status"]) => {
    if (!profile) return;
    const token = await getToken();
    if (!token) return;

    const previous = profile;
    setProfile({ ...profile, status });

    try {
      const updated = await api.profiles.changeStatus(token, profile.id, { status });
      setProfile(updated);
      toast.success("Profile status updated");
    } catch (err) {
      setProfile(previous);
      toast.error(
        err instanceof Error ? err.message : "Unable to update profile status"
      );
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="p-4 text-sm text-destructive">
        {error ?? "Profile not found"}
      </Card>
    );
  }

  return (
    <div className="grid gap-4 p-4 sm:p-6 overflow-auto">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {profile.profile_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created {new Date(profile.created_at).toLocaleDateString()} · Updated{" "}
              {new Date(profile.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(profile.status)}>{profile.status}</Badge>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/profiles/${profile.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </div>
      </header>

      <Card className="p-4">
        <div className="grid gap-4">
          <h2 className="text-sm font-semibold">Profile status</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={profile.status === "draft" ? "secondary" : "outline"}
              onClick={() => void handleStatusChange("draft")}
            >
              Draft
            </Button>
            <Button
              variant={profile.status === "active" ? "secondary" : "outline"}
              onClick={() => void handleStatusChange("active")}
            >
              Active
            </Button>
            <Button
              variant={profile.status === "archived" ? "secondary" : "outline"}
              onClick={() => void handleStatusChange("archived")}
            >
              Archived
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-4">
          <h2 className="text-sm font-semibold">Academic record</h2>
          <div className="grid gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {profile.academic_record?.current_status ?? "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Institution:</span>{" "}
              {profile.academic_record?.current_institution ?? "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Field:</span>{" "}
              {profile.academic_record?.current_field ?? "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">GPA:</span>{" "}
              {profile.academic_record?.gpa ?? "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Language:</span>{" "}
              {profile.academic_record?.language_preference ?? "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Transcript:</span>{" "}
              {profile.academic_record?.transcript_url ?? "Not uploaded"}
            </p>
          </div>

          <Separator />

          <div className="grid gap-2">
            <p className="text-sm font-medium">Subject grades</p>
            {profile.academic_record?.subject_grades?.length ? (
              <div className="grid gap-2">
                {profile.academic_record.subject_grades.map((grade) => (
                  <div
                    key={grade.id}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{grade.subject_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Grade: {grade.grade ?? "-"}
                      {grade.weight ? ` · Weight: ${grade.weight}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subject grades.</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-4">
          <h2 className="text-sm font-semibold">Preferences</h2>
          <div className="grid gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Favorite subjects:</span>{" "}
              {profile.preferences?.favorite_subjects?.length
                ? profile.preferences.favorite_subjects.join(", ")
                : "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Disliked subjects:</span>{" "}
              {profile.preferences?.disliked_subjects?.length
                ? profile.preferences.disliked_subjects.join(", ")
                : "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Soft skills:</span>{" "}
              {profile.preferences?.soft_skills?.length
                ? profile.preferences.soft_skills.join(", ")
                : "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Hobbies:</span>{" "}
              {profile.preferences?.hobbies?.length
                ? profile.preferences.hobbies.join(", ")
                : "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Geographic preference:</span>{" "}
              {profile.preferences?.geographic_preference ?? "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Budget range:</span>{" "}
              {profile.preferences?.budget_range_min || profile.preferences?.budget_range_max
                ? `${profile.preferences?.budget_range_min ?? "-"} - ${
                    profile.preferences?.budget_range_max ?? "-"
                  }`
                : "Not provided"}
            </p>
            <p>
              <span className="text-muted-foreground">Career goals:</span>{" "}
              {profile.preferences?.career_goals ?? "Not provided"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
