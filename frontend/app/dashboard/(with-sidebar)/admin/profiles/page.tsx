"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import type { ProfileListItem } from "@/lib/api/admin.service";
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
import { Loader2, GraduationCap, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const columns: ColumnDef<ProfileListItem>[] = [
  {
    accessorKey: "user_email",
    header: ({ column }) => <SortableHeader column={column} title="User Email" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.user_email}</span>
        <span className="text-xs text-muted-foreground">
          ID: {row.original.user_id.slice(0, 8)}...
        </span>
      </div>
    ),
  },
  {
    accessorKey: "profile_name",
    header: ({ column }) => <SortableHeader column={column} title="Profile Name" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue("profile_name")}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, "default" | "secondary" | "outline"> = {
        active: "default",
        draft: "secondary",
        inactive: "outline",
      };
      return (
        <Badge variant={variants[status] || "outline"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "current_education_level",
    header: "Education Level",
    cell: ({ row }) => {
      const level = row.getValue("current_education_level") as string | null;
      if (!level) return <span className="text-muted-foreground">—</span>;
      
      const levels: Record<string, string> = {
        bac: "Baccalauréat",
        bac1: "Bac+1",
        bac2: "Bac+2",
        bac3: "Bac+3 (Licence)",
        bac5: "Bac+5 (Master)",
        other: "Other",
      };
      
      return (
        <div className="flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{levels[level] || level}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "current_field",
    header: "Current Field",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("current_field") || "—"}</span>
    ),
  },
  {
    accessorKey: "target_field",
    header: "Target Field",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("target_field") || "—"}</span>
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
    header: ({ column }) => <SortableHeader column={column} title="Updated" />,
    cell: ({ row }) => {
      const date = row.getValue("updated_at") as string;
      return date ? (
        <span className="text-sm text-muted-foreground">
          {format(new Date(date), "MMM d, yyyy")}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
];

export default function AdminProfilesPage() {
  const { getToken } = useAuth();
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadProfiles();
  }, [statusFilter]);

  async function loadProfiles() {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const data = await api.admin.listProfiles(token, {
        skip: 0,
        limit: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setProfiles(data);
    } catch (err: any) {
      console.error("Failed to load profiles:", err);
      setError(err.message || "Failed to load profiles");
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
        <h1 className="text-xl font-semibold">User Profiles</h1>
      </header>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div>
          <p className="text-muted-foreground">
            Manage and monitor all user academic profiles
          </p>
        </div>

      <DataTable
        columns={columns}
        data={profiles}
        searchKey="user_email"
        searchPlaceholder="Search by email..."
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
                <SelectItem value="draft">Draft</SelectItem>
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
