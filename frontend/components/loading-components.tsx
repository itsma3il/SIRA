/**
 * Loading component for lazy-loaded components
 * Provides consistent loading UI across the application
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ComponentLoader() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </Card>
  );
}

export function ChartLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <div className="flex gap-2 justify-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function AdminDashboardLoader() {
  return (
    <div className="grid gap-4 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
