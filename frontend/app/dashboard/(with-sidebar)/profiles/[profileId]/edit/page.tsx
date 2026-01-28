"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

import type { ProfileFormData } from "@/lib/profile-form-types";
import type { ProfileResponse } from "@/lib/profile-api-types";
import { api } from "@/lib/api";
import { buildProfileUpdatePayload, mapProfileResponseToFormData } from "@/lib/profile-mappers";
import { useProfileWizardStore } from "@/stores/profile-wizard-store";
import { ProfileWizard } from "@/components/profile/profile-wizard";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditProfilePage() {
  const params = useParams<{ profileId: string }>();
  const profileId = params.profileId;
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<ProfileResponse | null>(null);
  const reset = useProfileWizardStore((state) => state.reset);
  const initializeFromProfile = useProfileWizardStore((state) => state.initializeFromProfile);

  React.useEffect(() => {
    if (!isLoaded) return;

    const loadProfile = async () => {
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
        
        // Convert profile to form data and initialize wizard store
        const formData = mapProfileResponseToFormData(data);
        initializeFromProfile(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile");
        toast.error(err instanceof Error ? err.message : "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [isLoaded, getToken, profileId, initializeFromProfile]);

  React.useEffect(() => {
    // Reset on unmount
    return () => reset();
  }, [reset]);

  if (!isLoaded || loading) {
    return (
      <div className="grid gap-4">
        <header className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Edit profile</h1>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </header>
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Loading profile...
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="grid gap-4">
        <header className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Edit profile</h1>
            <p className="text-sm text-muted-foreground">Error loading profile</p>
          </div>
        </header>
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error || "Profile not found"}
        </Card>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/dashboard/profiles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to profiles
          </Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (data: ProfileFormData) => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      const payload = buildProfileUpdatePayload(data);
      const updated = await api.profiles.update(token, profileId, payload);
      toast.success("Profile updated");
      router.push(`/dashboard/profiles/${updated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile");
      toast.error(err instanceof Error ? err.message : "Unable to update profile");
    }
  };

  const handleUploadTranscript = async (file: File) => {
    const token = await getToken();
    if (!token) throw new Error("Authentication required");
    return api.profiles.uploadTranscript(token, file);
  };

  const handleRemoveTranscript = async (value: { filename: string } | null) => {
    const token = await getToken();
    if (!token || !value) return;
    await api.profiles.deleteTranscript(token, value.filename);
    toast.success("Transcript removed");
  };

  return (
    <div className="grid gap-4">
      <header className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/profiles/${profileId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Edit profile</h1>
          <p className="text-sm text-muted-foreground">
            Update {profile.profile_name}
          </p>
        </div>
      </header>

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
  );
}
