"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RecommendationSkeletonProps {
  className?: string;
}

export function RecommendationSkeleton({ className }: RecommendationSkeletonProps) {
  return (
    <div className={cn("relative w-full rounded-xl border-2 border-primary/20 bg-linear-to-br from-primary/5 via-background to-primary/5 p-6 shadow-lg", className)}>
      {/* Badge */}
      <div className="absolute -top-3 left-4 bg-background px-3 py-1 rounded-full border-2 border-primary/30">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4 animate-pulse" />
          Generating Recommendation
        </div>
      </div>

      {/* Content */}
      <Card className="mt-4 p-6 border-0 shadow-none bg-background/50">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-20 bg-muted rounded animate-pulse" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-6 w-24 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Programs skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 bg-muted rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Loading message */}
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing your profile and searching programs...</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
