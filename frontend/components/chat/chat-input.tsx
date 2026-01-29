"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles, Square } from "lucide-react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
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
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  onRecommend?: () => void;
  onAttachProfile?: (profileId: string) => void;
  profiles?: ProfileListResponse[];
  hasProfile?: boolean;
  recommendationDisabled?: boolean;
  disabled?: boolean;
  isStreaming?: boolean;
  isStreamingRecommendation?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  onRecommend,
  onAttachProfile,
  profiles = [],
  hasProfile = false,
  recommendationDisabled,
  disabled,
  isStreaming,
  isStreamingRecommendation = false,
}: ChatInputProps) {
  const canSend = value.trim().length > 0 && !disabled && !isStreaming;
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const recommendationLocked = Boolean(recommendationDisabled || disabled || isStreaming || isStreamingRecommendation);

  const handleRecommendation = () => {
    if (recommendationLocked) return;
    if (hasProfile) {
      onRecommend?.();
      return;
    }
    setProfileDialogOpen(true);
  };

  const handleAttachProfile = () => {
    if (!selectedProfile) return;
    onAttachProfile?.(selectedProfile);
    setProfileDialogOpen(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PromptInput
        value={value}
        onValueChange={onChange}
        onSubmit={canSend ? onSend : undefined}
        isLoading={isStreaming}
        disabled={disabled}
        className="border-input bg-background relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
      >
        <div className="flex flex-col">
          <PromptInputTextarea
            placeholder="Ask about programs, pathways, or goals..."
            className="bg-background! rounded-3xl min-h-11 pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
          />
          <PromptInputActions className="mt-5 flex w-full items-center justify-end gap-2 px-3 pb-3">
            <PromptInputAction tooltip={isStreamingRecommendation ? "Generating recommendation..." : recommendationDisabled ? "Recommendation already generated" : "Generate recommendation"}>
              <Button
                size="icon"
                variant={recommendationLocked ? "outline" : "secondary"}
                disabled={recommendationLocked}
                className={cn("rounded-full", recommendationLocked && "opacity-60")}
                onClick={handleRecommendation}
              >
                {isStreamingRecommendation ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </PromptInputAction>
            {isStreaming ? (
              <PromptInputAction tooltip="Stop generating">
                <Button
                  size="icon"
                  variant="destructive"
                  className="rounded-full"
                  onClick={onStop}
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              </PromptInputAction>
            ) : (
              <PromptInputAction tooltip={canSend ? "Send" : "Write a message"}>
                <Button
                  size="icon"
                  variant={canSend ? "default" : "outline"}
                  disabled={!canSend}
                  className="rounded-full"
                  onClick={onSend}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </PromptInputAction>
            )}
          </PromptInputActions>
        </div>
      </PromptInput>
      <p className="text-xs text-muted-foreground">Press Enter to send · Shift + Enter for a new line</p>
      {disabled && (
          <p className="text-xs text-muted-foreground">
            This conversation is archived. Restore it to continue chatting.
          </p>
        )}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Attach a profile to generate recommendations</DialogTitle>
            <DialogDescription>
              Recommendations are personalized and require a profile. Attach one now to continue.
            </DialogDescription>
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
                ) : profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.profile_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {profiles.length === 0 && (
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/profiles/new">Create a profile</Link>
              </Button>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setProfileDialogOpen(false)}>
              Not now
            </Button>
            <Button onClick={handleAttachProfile} disabled={!selectedProfile}>
              Attach profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
