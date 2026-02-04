/**
 * RecommendationCard Component
 * Displays a single recommendation with match score, program details, and expandable content
 */

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ChevronDown, ChevronUp, Copy, Check, MessageSquare, Star, GraduationCap, MapPin, DollarSign, Calendar, BarChart3 } from "lucide-react";
import type { Recommendation, RecommendationFeedback } from "@/lib/types/recommendation";
import { Card, CardContent} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FeedbackModal } from "@/components/feedback-modal";
import { Markdown } from "@/components/prompt-kit/markdown";
import { RecommendationCharts } from "@/components/recommendation-charts";
import { api } from "@/lib/api";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onFeedbackSubmitted?: (recommendationId: string, feedback: RecommendationFeedback) => void | Promise<void>;
}

export function RecommendationCard({ recommendation, onFeedbackSubmitted }: RecommendationCardProps) {
  const { getToken } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartsExpanded, setChartsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [reloadingSession, setReloadingSession] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<RecommendationFeedback | null>(
    recommendation.feedback_rating
      ? {
          feedback_rating: recommendation.feedback_rating,
          feedback_comment: recommendation.feedback_comment ?? undefined,
        }
      : null
  );

  // Get match score badge color
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  // Get match score label for accessibility
  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent match";
    if (score >= 60) return "Good match";
    return "Moderate match";
  };

  // Copy recommendation text to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recommendation.ai_response);
      setCopied(true);
      toast.success("Recommendation copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
      logger.logUserAction("copy_recommendation", {
        recommendation_id: recommendation.id,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy. Please try again.");
      logger.error("Failed to copy recommendation", err);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: RecommendationFeedback) => {
    try {
      setSubmittingFeedback(true);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // Retry logic for recommendations that might not be fully indexed yet
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await api.recommendations.submitFeedback(
            token,
            recommendation.id,
            feedback
          );
          
          setCurrentFeedback(feedback);
          
          logger.logFeedbackSubmission(
            recommendation.id,
            feedback.feedback_rating,
            !!feedback.feedback_comment
          );

          toast.success("Feedback Submitted ! Thank you for your feedback!");

          if (onFeedbackSubmitted) {
            setReloadingSession(true);
            await onFeedbackSubmitted(recommendation.id, feedback);
            setReloadingSession(false);
          }
          return; // Success, exit early
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown error");
          
          // Check if it's a 404 (might be a timing issue)
          const is404 = lastError.message.includes("404") || lastError.message.includes("not found");
          if (is404 && attempt < 2) {
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
            continue;
          }
          
          // Not a 404 or last attempt, throw error
          throw error;
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error("Failed to submit feedback");
    } catch (error) {
      logger.error("Failed to submit feedback", error);
      toast.error("Failed to submit feedback. Please try again.");
      throw error;
    } finally {
      setSubmittingFeedback(false);
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

  // Get structured data
  const structuredData = recommendation.structured_data || {};
  const programNames = structuredData.program_names || [];
  const matchScores = structuredData.match_scores || [];
  const tuitionFees = structuredData.tuition_fees || [];
  
  // Get top 3 programs with their data
  const topPrograms = programNames.slice(0, 3).map((name, idx) => ({
    name,
    score: matchScores[idx] || 0,
    tuition: tuitionFees[idx],
    university: recommendation.retrieved_context?.[idx]?.university || "University",
    metadata: recommendation.retrieved_context?.[idx]?.metadata || {},
  }));

  // Get average match score
  const avgMatchScore = matchScores.length > 0
    ? matchScores.reduce((a, b) => a + b, 0) / matchScores.length
    : 0;

  return (
    <>
      <div className="space-y-4">
        {/* Match Score and Date */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{formatDate(recommendation.created_at)}</span>
          <Badge 
            className={`${getMatchScoreColor(avgMatchScore)} text-white font-semibold`}
            aria-label={`Match score: ${Math.round(avgMatchScore)}% - ${getMatchScoreLabel(avgMatchScore)}`}
          >
            {Math.round(avgMatchScore)}% Match
          </Badge>
        </div>

        {/* Top Programs as Cards */}
        {topPrograms.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Top {topPrograms.length} Programs
            </p>
            <div className="grid gap-3">
              {topPrograms.map((program, idx) => (
                <Card key={idx} className="overflow-hidden border-l-4" style={{
                  borderLeftColor: program.score >= 80 ? '#10b981' : program.score >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <GraduationCap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm leading-tight">{program.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{program.university}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {program.metadata?.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{program.metadata.location}</span>
                            </div>
                          )}
                          {program.tuition && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{program.tuition.toLocaleString()} MAD/year</span>
                            </div>
                          )}
                          {program.metadata?.duration_years && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{program.metadata.duration_years} years</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Badge className={`${getMatchScoreColor(program.score)} text-white shrink-0`}>
                        {Math.round(program.score)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Visual Data & Charts */}
        {structuredData && Object.keys(structuredData).length > 0 && (
          <Collapsible open={chartsExpanded} onOpenChange={setChartsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                aria-label={chartsExpanded ? "Hide visual data and charts" : "Show visual data and charts"}
                aria-expanded={chartsExpanded}
              >
                {chartsExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Hide Visual Data
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Show Visual Data & Charts
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <RecommendationCharts structuredData={structuredData} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Expandable Full AI Analysis */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              aria-label={isExpanded ? "Hide full AI analysis" : "View full AI analysis"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Hide Full Analysis
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  View Full AI Analysis
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <Markdown className="prose prose-sm max-w-none dark:prose-invert">
                {recommendation.ai_response}
              </Markdown>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            {currentFeedback ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {currentFeedback.feedback_rating}/5
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackModalOpen(true)}
                className="gap-2"
                aria-label="Rate this recommendation"
              >
                <MessageSquare className="h-4 w-4" />
                Rate
              </Button>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyToClipboard} 
            className="gap-2"
            aria-label={copied ? "Recommendation copied" : "Copy recommendation to clipboard"}
          >
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

      <FeedbackModal
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
        onSubmit={handleFeedbackSubmit}
        initialRating={currentFeedback?.feedback_rating}
        initialComment={currentFeedback?.feedback_comment}
        disabled={submittingFeedback || reloadingSession}
      />
    </>
  );
}
