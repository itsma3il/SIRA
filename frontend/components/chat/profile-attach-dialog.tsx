"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProfileListResponse } from "@/lib/profile-api-types";

interface ProfileAttachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: ProfileListResponse[];
  onAttach: (profileId: string) => void;
  title?: string;
  description?: string;
}

export function ProfileAttachDialog({
  open,
  onOpenChange,
  profiles,
  onAttach,
  title = "Attach a profile",
  description = "Select a profile to attach to this session for personalized recommendations.",
}: ProfileAttachDialogProps) {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const handleAttach = () => {
    if (!selectedProfile) return;
    onAttach(selectedProfile);
    setSelectedProfile(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedProfile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={selectedProfile ?? undefined} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles.length === 0 ? (
                <SelectItem value="no-profiles" disabled>
                  No profiles available
                </SelectItem>
              ) : (
                profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.profile_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {profiles.length === 0 && (
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/profiles/new">Create a profile</Link>
            </Button>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAttach} disabled={!selectedProfile}>
            Attach profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
