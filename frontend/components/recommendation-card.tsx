/**
 * RecommendationCard Component
 * Displays a single recommendation with match score, program details, and expandable content
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, MessageSquare, Star, GraduationCap, MapPin, DollarSign, Calendar, BarChart3 } from "lucide-react";
import type { Recommendation, RecommendationFeedback } from "@/lib/types/recommendation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FeedbackModal } from "@/components/feedback-modal";
import { Markdown } from "@/components/prompt-kit/markdown";
import { RecommendationCharts } from "@/components/recommendation-charts";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onFeedback?: (recommendationId: string, rating: number) => void;
}

export function RecommendationCard({ recommendation, onFeedback }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartsExpanded, setChartsExpanded] = useState(false);
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
          <Badge className={`${getMatchScoreColor(avgMatchScore)} text-white font-semibold`}>
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
              <Button variant="outline" size="sm" className="w-full">
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
            <Button variant="outline" size="sm" className="w-full">
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
