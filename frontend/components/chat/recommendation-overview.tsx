"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";

import type { RecommendationSummary } from "@/lib/types/conversation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface RecommendationOverviewProps {
  recommendation?: RecommendationSummary | null;
  profileName?: string | null;
}

export function RecommendationOverview({
  recommendation,
  profileName,
}: RecommendationOverviewProps) {
  const matchScore = useMemo(() => {
    const scores = recommendation?.structured_data?.match_scores as number[] | undefined;
    if (!scores || scores.length === 0) return null;
    const sum = scores.reduce((acc, value) => acc + value, 0);
    return Math.round(sum / scores.length);
  }, [recommendation]);

  return (
    <Card className="flex flex-col gap-4 bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Recommendation summary
          </p>
          <p className="text-xs text-muted-foreground">
            {recommendation
              ? "Your latest recommendation is ready."
              : profileName
                ? "You can request a recommendation from the chat actions."
                : "Attach a profile to unlock recommendations."}
          </p>
          {profileName && (
            <p className="text-xs text-muted-foreground">Profile: {profileName}</p>
          )}
        </div>
        
        {matchScore !== null && (
          <Badge className="bg-primary/10 text-primary">{matchScore}% match</Badge>
        )}
        {recommendation ? (
          <div className="text-xs text-muted-foreground">
            Generated on {new Date(recommendation.created_at).toLocaleString()}.
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Use the recommendation action in the chat input.
          </div>
        )}
      </div>


    </Card>
  );
}
