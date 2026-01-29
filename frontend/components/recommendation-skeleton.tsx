/**
 * Loading skeleton for recommendation cards
 * Provides consistent loading state across the application
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecommendationSkeleton() {
  return (
    <div className="space-y-4">
      {/* Match Score and Date skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Top Programs skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
