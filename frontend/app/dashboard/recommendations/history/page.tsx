"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { RecommendationCard } from "@/components/recommendation-card";
import { getProfileRecommendations } from "@/lib/api/recommendations";
import type { Recommendation } from "@/lib/types/recommendation";
import { AlertCircle, Search, SlidersHorizontal, FileText, Calendar } from "lucide-react";

export default function RecommendationHistoryPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadAllRecommendations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recommendations, searchQuery, ratingFilter, sortBy]);

  const loadAllRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // For now, we'll fetch from the first profile
      // In a real app, you'd fetch user's profiles first
      // This is a placeholder - replace with actual profile selection logic
      const profileId = user?.publicMetadata?.profileId as string || "dummy-profile-id";
      
      const result = await getProfileRecommendations(profileId, token, 100);
      setRecommendations(result.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recommendations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rec => 
        rec.ai_response.toLowerCase().includes(query) ||
        rec.query.toLowerCase().includes(query) ||
        rec.structured_data?.program_names?.some(name => name.toLowerCase().includes(query))
      );
    }

    // Rating filter
    if (ratingFilter !== "all") {
      if (ratingFilter === "rated") {
        filtered = filtered.filter(rec => rec.feedback_rating !== null);
      } else if (ratingFilter === "unrated") {
        filtered = filtered.filter(rec => rec.feedback_rating === null);
      } else {
        const rating = parseInt(ratingFilter);
        filtered = filtered.filter(rec => rec.feedback_rating === rating);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "highest_rated":
          return (b.feedback_rating || 0) - (a.feedback_rating || 0);
        case "lowest_rated":
          return (a.feedback_rating || 0) - (b.feedback_rating || 0);
        default:
          return 0;
      }
    });

    setFilteredRecommendations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFeedback = async (recommendationId: string, rating: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const { submitRecommendationFeedback } = await import("@/lib/api/recommendations");
      await submitRecommendationFeedback(recommendationId, { feedback_rating: rating }, token);
      
      // Reload recommendations
      await loadAllRecommendations();
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredRecommendations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecommendations = filteredRecommendations.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: recommendations.length,
    rated: recommendations.filter(r => r.feedback_rating !== null).length,
    avgRating: recommendations.filter(r => r.feedback_rating !== null).length > 0
      ? (recommendations.reduce((sum, r) => sum + (r.feedback_rating || 0), 0) / 
         recommendations.filter(r => r.feedback_rating !== null).length).toFixed(1)
      : "N/A"
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Recommendation History
        </h1>
        <p className="text-muted-foreground">
          View and manage all your generated recommendations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Recommendations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.rated}</div>
            <p className="text-sm text-muted-foreground">Rated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.avgRating}</div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-5 w-5" />
            <span className="font-semibold">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="rated">Rated</SelectItem>
                <SelectItem value="unrated">Unrated</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest_rated">Highest Rated</SelectItem>
                <SelectItem value="lowest_rated">Lowest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchQuery || ratingFilter !== "all" || sortBy !== "newest") && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {ratingFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Rating: {ratingFilter}
                  <button onClick={() => setRatingFilter("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {sortBy !== "newest" && (
                <Badge variant="secondary" className="gap-1">
                  Sort: {sortBy}
                  <button onClick={() => setSortBy("newest")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {filteredRecommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {recommendations.length === 0 
                ? "No recommendations yet. Generate your first one!"
                : "No recommendations match your filters."}
            </p>
            {recommendations.length > 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setRatingFilter("all");
                  setSortBy("newest");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredRecommendations.length)} of {filteredRecommendations.length} results
          </div>

          {/* Recommendation Cards */}
          <div className="space-y-4 mb-6">
            {paginatedRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onFeedback={(id, rating) => handleFeedback(id, rating)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    size="sm"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
