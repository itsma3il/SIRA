"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { ProfileListResponse } from "@/lib/profile-api-types";
import type { RecommendationSummary } from "@/lib/types/conversation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecommendationOverviewProps {
  recommendation?: RecommendationSummary | null;
  profileName?: string | null;
  isStreaming?: boolean;
  profiles?: ProfileListResponse[];
  onGenerate: () => void;
  onAttachProfile?: (profileId: string) => void;
}

export function RecommendationOverview({
  recommendation,
  profileName,
  isStreaming,
  profiles = [],
  onGenerate,
  onAttachProfile,
}: RecommendationOverviewProps) {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const matchScore = useMemo(() => {
    const scores = recommendation?.structured_data?.match_scores as number[] | undefined;
    if (!scores || scores.length === 0) return null;
    const sum = scores.reduce((acc, value) => acc + value, 0);
    return Math.round(sum / scores.length);
  }, [recommendation]);

  return (
    <Card className="flex flex-col gap-4 border border-border/60 bg-muted/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Recommendation summary
          </p>
          <p className="text-xs text-muted-foreground">
            {recommendation
              ? "Your latest recommendation is ready."
              : profileName
              ? "Generate a recommendation for this profile."
              : "Attach a profile to unlock recommendations."}
          </p>
        </div>
        {matchScore !== null && (
          <Badge className="bg-primary/10 text-primary">{matchScore}% match</Badge>
        )}
      </div>

      {recommendation ? (
        <div className="text-xs text-muted-foreground">
          Generated on {new Date(recommendation.created_at).toLocaleString()}.
        </div>
      ) : profileName ? (
        <Button onClick={onGenerate} disabled={isStreaming} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {isStreaming ? "Generating..." : "Generate recommendation"}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedProfile ?? undefined} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-64">
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
          <Button
            variant="outline"
            onClick={() => selectedProfile && onAttachProfile?.(selectedProfile)}
            disabled={!selectedProfile}
          >
            Attach profile
          </Button>
          {profiles.length === 0 && (
            <Button variant="ghost" asChild>
              <Link href="/dashboard/profiles/new">Create a profile</Link>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
