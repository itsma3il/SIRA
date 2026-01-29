"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FeedbackTrendsProps {
  data: {
    period_days: number;
    total_recommendations: number;
    total_feedback: number;
    feedback_rate: number;
    average_rating: number;
    rating_distribution: Record<number, number>;
    positive_feedback_count: number;
    positive_feedback_rate: number;
    negative_feedback_count: number;
    negative_feedback_rate: number;
  };
}

export function FeedbackTrendsCard({ data }: FeedbackTrendsProps) {
  const ratingTrend = data.average_rating >= 4 ? "up" : data.average_rating >= 3 ? "stable" : "down";
  
  const getTrendIcon = () => {
    switch (ratingTrend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getTrendColor = () => {
    switch (ratingTrend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Feedback Trends</span>
          <Badge variant="outline">{data.period_days} days</Badge>
        </CardTitle>
        <CardDescription>
          User feedback analysis over the last {data.period_days} days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Average Rating</span>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-2xl font-bold ${getTrendColor()}`}>
                {data.average_rating.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
          </div>
          <Progress value={(data.average_rating / 5) * 100} className="h-2" />
        </div>

        {/* Feedback Collection Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Feedback Collection Rate</span>
            <span className="text-sm font-bold">{data.feedback_rate}%</span>
          </div>
          <Progress value={data.feedback_rate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {data.total_feedback} out of {data.total_recommendations} recommendations
          </p>
        </div>

        {/* Sentiment Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Positive</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {data.positive_feedback_rate}%
            </p>
            <p className="text-xs text-muted-foreground">
              {data.positive_feedback_count} ratings (4-5 ⭐)
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium">Negative</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {data.negative_feedback_rate}%
            </p>
            <p className="text-xs text-muted-foreground">
              {data.negative_feedback_count} ratings (1-2 ⭐)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
