/**
 * RecommendationCard Component
 * Displays a single recommendation with match score, program details, and expandable content
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, MessageSquare, Star } from "lucide-react";
import type { Recommendation, RecommendationFeedback } from "@/lib/types/recommendation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FeedbackModal } from "@/components/feedback-modal";
import { Markdown } from "@/components/prompt-kit/markdown";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onFeedback?: (recommendationId: string, rating: number) => void;
}

export function RecommendationCard({ recommendation, onFeedback }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Get match score badge color
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  // Copy recommendation text to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recommendation.ai_response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get average match score
  const avgMatchScore =
    recommendation.structured_data?.match_scores?.reduce((a, b) => a + b, 0) /
      (recommendation.structured_data?.match_scores?.length || 1) || 0;

  return (
    <>
      <div className="space-y-4">
        {/* Match Score and Date */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{formatDate(recommendation.created_at)}</span>
          <Badge className={`${getMatchScoreColor(avgMatchScore)} text-white font-semibold`}>
            {Math.round(avgMatchScore)}% Match
          </Badge>
        </div>

        {/* Retrieved Programs Summary */}
        {recommendation.retrieved_context && recommendation.retrieved_context.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Based on {recommendation.retrieved_context.length} programs</p>
            <div className="flex flex-wrap gap-1.5">
              {recommendation.retrieved_context.slice(0, 4).map((program, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs font-normal">
                  {program.university}
                </Badge>
              ))}
              {recommendation.retrieved_context.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{recommendation.retrieved_context.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Recommendation Preview */}
        <Markdown className="prose prose-sm max-w-none dark:prose-invert">
          {recommendation.ai_response.length > 300
            ? `${recommendation.ai_response.slice(0, 300)}...`
            : recommendation.ai_response}
        </Markdown>

        {/* Expandable Full Content */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show Full Recommendation
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="rounded-lg border p-4">
              <Markdown className="prose prose-sm max-w-none dark:prose-invert">
                {recommendation.ai_response}
              </Markdown>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            {recommendation.feedback_rating ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {recommendation.feedback_rating}/5
              </Badge>
            ) : (
              onFeedback && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedbackModalOpen(true)}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Rate
                </Button>
              )
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={copyToClipboard} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {onFeedback && (
        <FeedbackModal
          open={feedbackModalOpen}
          onOpenChange={setFeedbackModalOpen}
          onSubmit={(rating) => {
            onFeedback(recommendation.id, rating);
            setFeedbackModalOpen(false);
          }}
        />
      )}
    </>
  );
}
