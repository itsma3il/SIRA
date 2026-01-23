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
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
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
      year: "numeric",
      month: "long",
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Academic Recommendation</CardTitle>
            <CardDescription>{formatDate(recommendation.created_at)}</CardDescription>
          </div>
          <Badge className={`${getMatchScoreColor(avgMatchScore)} text-white`}>
            {Math.round(avgMatchScore)}% Match
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Retrieved Programs Summary */}
        {recommendation.retrieved_context && recommendation.retrieved_context.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Based on {recommendation.retrieved_context.length} programs:</h4>
            <div className="flex flex-wrap gap-2">
              {recommendation.retrieved_context.slice(0, 3).map((program, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {program.university}
                </Badge>
              ))}
              {recommendation.retrieved_context.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{recommendation.retrieved_context.length - 3} more
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
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {recommendation.feedback_rating ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              Rated {recommendation.feedback_rating}/5
              {recommendation.feedback_comment && (
                <span className="text-xs ml-1">(has comment)</span>
              )}
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
                Rate Recommendation
              </Button>
            )
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={copyToClipboard}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </CardFooter>

      {/* Feedback Modal */}
      {onFeedback && (
        <FeedbackModal
          open={feedbackModalOpen}
          onOpenChange={setFeedbackModalOpen}
          onSubmit={async (feedback: RecommendationFeedback) => {
            onFeedback(recommendation.id, feedback.feedback_rating);
          }}
          initialRating={recommendation.feedback_rating || undefined}
          initialComment={recommendation.feedback_comment || undefined}
        />
      )}
    </Card>
  );
}
