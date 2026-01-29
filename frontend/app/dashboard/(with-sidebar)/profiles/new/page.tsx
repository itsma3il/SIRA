"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

import type { ProfileFormData } from "@/lib/profile-form-types";
import { api } from "@/lib/api";
import { buildProfileCreatePayload } from "@/lib/profile-mappers";
import { useProfileWizardStore } from "@/stores/profile-wizard-store";
import { ProfileWizard } from "@/components/profile/profile-wizard";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function NewProfilePage() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const reset = useProfileWizardStore((state) => state.reset);

  React.useEffect(() => {
    reset();
  }, [reset]);

  if (!isLoaded) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Loading profile wizard...</p>
      </Card>
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
      const payload = buildProfileCreatePayload(data);
      const profile = await api.profiles.create(token, payload);
      toast.success("Profile created");
      router.push(`/dashboard/profiles/${profile.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
      toast.error(err instanceof Error ? err.message : "Unable to save profile");
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
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New profile</h1>
          <p className="text-sm text-muted-foreground">
            Create a profile to personalize recommendations.
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
