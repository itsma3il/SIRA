"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { RecommendationAnalytics } from "@/lib/api/admin.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Star,
  User,
  Calendar,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import { format } from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Markdown } from "@/components/prompt-kit/markdown";
import { RecommendationCharts } from "@/components/recommendation-charts";

export default function RecommendationDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const recommendationId = params.id as string;

  const [recommendation, setRecommendation] = useState<RecommendationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendation();
  }, [recommendationId]);

  async function loadRecommendation() {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const data = await api.admin.getRecommendationAnalytics(token, recommendationId);
      setRecommendation(data);
    } catch (err: any) {
      console.error("Failed to load recommendation:", err);
      setError(err.message || "Failed to load recommendation details");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error || "Recommendation not found"}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Recommendation Details</h1>
      </header>
      <div className="flex-1 space-y-6 p-8 pt-6">

      <div className="grid gap-6 md:grid-cols-2">
        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Recommendation information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">User</p>
                <p className="text-sm text-muted-foreground">{recommendation.user_email || "Unknown"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Profile</p>
                <p className="text-sm text-muted-foreground">{recommendation.profile_name || "Unknown"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(recommendation.created_at), "MMM d, yyyy 'at' HH:mm")}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Session ID</p>
                <p className="text-xs text-muted-foreground font-mono">{recommendation.session_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Feedback</CardTitle>
            <CardDescription>Rating and comments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendation.feedback_rating ? (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Rating</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < recommendation.feedback_rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium">
                      {recommendation.feedback_rating}/5
                    </span>
                  </div>
                </div>
                {recommendation.feedback_comment && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Comment</p>
                      <p className="text-sm text-muted-foreground">
                        {recommendation.feedback_comment}
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No feedback provided yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Query Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Query</CardTitle>
          <CardDescription>The question or request that triggered this recommendation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{recommendation.query}</p>
        </CardContent>
      </Card>

      {/* AI Response Card */}
      <Card>
        <CardHeader>
          <CardTitle>AI Response</CardTitle>
          <CardDescription>The complete recommendation provided to the user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Markdown>{recommendation.ai_response}</Markdown>
          </div>
        </CardContent>
      </Card>

      {/* Programs Card with Charts */}
      {recommendation.programs && recommendation.programs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Programs ({recommendation.programs.length})</CardTitle>
            <CardDescription>Academic programs suggested in this recommendation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              {recommendation.programs.map((program, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{program.name}</span>
                  </div>
                  {program.match_score && (
                    <Badge variant="secondary">
                      Score: {(program.match_score * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {/* Charts Section */}
            {recommendation.structured_data && (
              <div className="mt-6 pt-6 border-t">
                <RecommendationCharts structuredData={recommendation.structured_data} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Retrieved Context Card */}
      {recommendation.retrieved_context && (
        <Card>
          <CardHeader>
            <CardTitle>Retrieved Context</CardTitle>
            <CardDescription>Relevant information retrieved from the knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(recommendation.retrieved_context, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Structured Data Card */}
      {recommendation.structured_data && (
        <Card>
          <CardHeader>
            <CardTitle>Structured Data</CardTitle>
            <CardDescription>Parsed recommendation metadata</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(recommendation.structured_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}
