"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { RecommendationListItem } from "@/lib/api/admin.service";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/data-table";
import { SortableHeader } from "@/components/admin/sortable-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, Star, Eye, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminRecommendationsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [feedbackFilter, setFeedbackFilter] = useState<string>("all");

  const columns: ColumnDef<RecommendationListItem>[] = [
    {
      accessorKey: "created_at",
      header: ({ column }) => <SortableHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(row.getValue("created_at")), "MMM d, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "user_email",
      header: ({ column }) => <SortableHeader column={column} title="User" />,
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.getValue("user_email") || "—"}</span>
      ),
    },
    {
      accessorKey: "profile_name",
      header: "Profile",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.getValue("profile_name") || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "program_count",
      header: ({ column }) => <SortableHeader column={column} title="Programs" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("program_count")}</span>
      ),
    },
    {
      accessorKey: "feedback_rating",
      header: ({ column }) => <SortableHeader column={column} title="Rating" />,
      cell: ({ row }) => {
        const rating = row.getValue("feedback_rating") as number | null;
        if (!rating) {
          return <span className="text-xs text-muted-foreground">No rating</span>;
        }
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                }`}
              />
            ))}
            <span className="ml-1 text-xs font-medium">{rating}/5</span>
          </div>
        );
      },
    },
    {
      accessorKey: "feedback_comment",
      header: "Feedback",
      cell: ({ row }) => {
        const comment = row.getValue("feedback_comment") as string | null;
        if (!comment) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <span className="text-xs text-muted-foreground truncate max-w-50 block">
            {comment}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/admin/recommendations/${row.original.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Details
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    loadRecommendations();
  }, [ratingFilter, feedbackFilter]);

  async function loadRecommendations() {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      let minRating, maxRating, hasFeedback;

      if (ratingFilter === "high") {
        minRating = 4;
      } else if (ratingFilter === "low") {
        maxRating = 2;
      }

      if (feedbackFilter === "with") {
        hasFeedback = true;
      } else if (feedbackFilter === "without") {
        hasFeedback = false;
      }

      const data = await api.admin.listRecommendations(token, {
        skip: 0,
        limit: 100,
        min_rating: minRating,
        max_rating: maxRating,
        has_feedback: hasFeedback,
      });

      setRecommendations(data);
    } catch (err: any) {
      console.error("Failed to load recommendations:", err);
      setError(err.message || "Failed to load recommendations");
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

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-semibold">Recommendations</h1>
      </header>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div>
          <p className="text-muted-foreground">
            Review and analyze all recommendation generations
          </p>
        </div>

      <DataTable
        columns={columns}
        data={recommendations}
        searchKey="user_email"
        searchPlaceholder="Search by user email..."
        filterComponent={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Rating:</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-37.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High (4-5★)</SelectItem>
                  <SelectItem value="low">Low (1-2★)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Feedback:</label>
              <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                <SelectTrigger className="w-37.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="with">With Feedback</SelectItem>
                  <SelectItem value="without">Without Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />
      </div>
    </div>
  );
}
