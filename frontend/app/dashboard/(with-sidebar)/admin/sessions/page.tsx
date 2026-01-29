"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import type { SessionListItem } from "@/lib/api/admin.service";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/data-table";
import { SortableHeader } from "@/components/admin/sortable-header";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const columns: ColumnDef<SessionListItem>[] = [
  {
    accessorKey: "id",
    header: "Session ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.getValue("id")?.toString().slice(0, 12)}...
      </span>
    ),
  },
  {
    accessorKey: "user_email",
    header: ({ column }) => <SortableHeader column={column} title="User" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.user_email}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.user_id.slice(0, 8)}...
        </span>
      </div>
    ),
  },
  {
    accessorKey: "profile_name",
    header: "Profile",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("profile_name") || "—"}</span>
    ),
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} title="Title" />,
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.getValue("title")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "active" ? "default" : "outline"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "message_count",
    header: ({ column }) => <SortableHeader column={column} title="Messages" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("message_count")}</span>
      </div>
    ),
  },
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
    accessorKey: "updated_at",
    header: ({ column }) => <SortableHeader column={column} title="Last Activity" />,
    cell: ({ row }) => {
      const date = row.getValue("updated_at") as string;
      return date ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(date), "MMM d, HH:mm")}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
];

export default function AdminSessionsPage() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadSessions();
  }, [statusFilter]);

  async function loadSessions() {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const data = await api.admin.listSessions(token, {
        skip: 0,
        limit: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setSessions(data);
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
      setError(err.message || "Failed to load sessions");
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
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-xl font-semibold">Chat Sessions</h1>
      </header>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div>
          <p className="text-muted-foreground">
            Monitor all conversation sessions and activity
          </p>
        </div>

      <DataTable
        columns={columns}
        data={sessions}
        searchKey="user_email"
        searchPlaceholder="Search by user email..."
        filterComponent={
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-37.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      </div>
    </>
  );
}
