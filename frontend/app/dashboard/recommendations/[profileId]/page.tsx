"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { RecommendationCard } from "@/components/recommendation-card";
import { useRecommendationStream } from "@/hooks/use-recommendation-stream";
import { getProfileRecommendations } from "@/lib/api/recommendations";
import type { Recommendation } from "@/lib/types/recommendation";
import { AlertCircle, Sparkles, FileText } from "lucide-react";

export default function RecommendationGenerationPage() {
  const params = useParams();
  const profileId = params.profileId as string;
  const { getToken } = useAuth();
  
  const [savedRecommendations, setSavedRecommendations] = useState<Recommendation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  const { content, isLoading, isComplete, error, generate, reset } = useRecommendationStream();

  // Load existing recommendations on mount
  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const loadRecommendations = async () => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);
      const token = await getToken();
      if (!token) {
        setHistoryError("Authentication required");
        return;
      }
      const result = await getProfileRecommendations(profileId, token, 5);
      setSavedRecommendations(result.recommendations);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load recommendations");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      generate(profileId, token);
    } catch (err) {
      console.error("Generation error:", err);
    }
  };

  // Reload recommendations when generation completes
  useEffect(() => {
    if (isComplete) {
      loadRecommendations();
    }
  }, [isComplete]);

  const handleFeedback = async (recommendationId: string, rating: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      
      // Import submitRecommendationFeedback
      const { submitRecommendationFeedback } = await import("@/lib/api/recommendations");
      await submitRecommendationFeedback(recommendationId, { feedback_rating: rating }, token);
      
      // Reload to show updated feedback
      await loadRecommendations();
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Recommendation Engine
        </h1>
        <p className="text-muted-foreground">
          Generate personalized academic program recommendations based on your profile
        </p>
      </div>

      {/* Generation Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Recommendation</CardTitle>
          <CardDescription>
            Our AI will analyze your profile and search through {" "}
            <span className="font-semibold">thousands of academic programs</span> to find the best matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Recommendation
              </>
            )}
          </Button>

          {/* Streaming Content Display */}
          {(isLoading || content) && (
            <div className="mt-6">
              <div className="rounded-lg border bg-muted/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    {isLoading ? "Generating..." : "Generated Recommendation"}
                  </span>
                </div>
                
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {content.split('\n').map((line, idx) => (
                    <p key={idx} className="mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {line}
                    </p>
                  ))}
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    <span className="text-sm">AI is analyzing programs...</span>
                  </div>
                )}

                {isComplete && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      ✅ Recommendation generated successfully! Scroll down to see details.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* History Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Previous Recommendations
        </h2>

        {loadingHistory ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : historyError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{historyError}</AlertDescription>
          </Alert>
        ) : savedRecommendations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No recommendations yet. Generate your first one above!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onFeedback={(id, rating) => handleFeedback(id, rating)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
