"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

import type { ProfileListResponse } from "@/lib/profile-api-types";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const statusVariant = (status: ProfileListResponse["status"]) => {
  switch (status) {
    case "active":
      return "secondary";
    case "archived":
      return "outline";
    default:
      return "default";
  }
};

export default function ProfilesPage() {
  const { getToken, isLoaded } = useAuth();
  const [profiles, setProfiles] = React.useState<ProfileListResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("updated_desc");
  const [showActions, setShowActions] = React.useState(true);

  const loadProfiles = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }
      const data = await api.profiles.list(token);
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profiles");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  React.useEffect(() => {
    if (!isLoaded) return;
    void loadProfiles();
  }, [isLoaded, loadProfiles]);

  const handleDelete = async (profileId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this profile? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const token = await getToken();
    if (!token) return;

    const previous = profiles;
    setProfiles((current) => current.filter((item) => item.id !== profileId));

    try {
      await api.profiles.deleteById(token, profileId);
      toast.success("Profile deleted");
    } catch (err) {
      setProfiles(previous);
      toast.error(
        err instanceof Error ? err.message : "Unable to delete profile"
      );
    }
  };

  const filteredProfiles = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = profiles.filter((profile) =>
      profile.profile_name.toLowerCase().includes(query)
    );

    return result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.profile_name.localeCompare(b.profile_name);
        case "name_desc":
          return b.profile_name.localeCompare(a.profile_name);
        case "created_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated_asc":
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case "updated_desc":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }, [profiles, search, sortBy]);

  return (
    <div className="grid gap-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Profile management
            </h1>
            <p className="text-sm text-muted-foreground">
              Create and manage student profiles for recommendations.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/profiles/new">New profile</Link>
        </Button>
      </header>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-50 flex-1 items-center gap-2">
            <Label htmlFor="profile-search" className="text-xs text-muted-foreground">
              Search
            </Label>
            <Input
              id="profile-search"
              placeholder="Search profiles"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Sort by</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Recently updated</SelectItem>
                <SelectItem value="updated_asc">Least recently updated</SelectItem>
                <SelectItem value="created_desc">Newest created</SelectItem>
                <SelectItem value="created_asc">Oldest created</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Show actions</Label>
            <Switch checked={showActions} onCheckedChange={setShowActions} />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Loading profiles...</p>
        </Card>
      ) : error ? (
        <Card className="p-4">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      ) : filteredProfiles.length === 0 ? (
        <Card className="p-4">
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium">No profiles found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or create a new profile.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {profile.profile_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={statusVariant(profile.status)}>
                  {profile.status}
                </Badge>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Updated {new Date(profile.updated_at).toLocaleDateString()}
              </div>

              {showActions ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/profiles/${profile.id}`}>View</Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/dashboard/profiles/${profile.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleDelete(profile.id)}
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
