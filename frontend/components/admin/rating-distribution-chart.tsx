"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface RatingDistributionProps {
  distribution: Record<number, number>;
}

export function RatingDistributionChart({ distribution }: RatingDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(distribution), 1);

  const ratings = [5, 4, 3, 2, 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rating Distribution</CardTitle>
        <CardDescription>Breakdown of user ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ratings.map((rating) => {
            const count = distribution[rating] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const barWidth = total > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={rating} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{count}</span>
                    <span className="font-medium w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="relative h-6 bg-secondary rounded-md overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-md transition-all ${
                      rating >= 4
                        ? "bg-green-500"
                        : rating === 3
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {total === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No ratings yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
