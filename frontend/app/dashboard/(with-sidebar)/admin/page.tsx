"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Users,
    FileText,
    MessageSquare,
    Star,
    TrendingUp,
    AlertCircle,
    BarChart3,
    Loader2
} from "lucide-react";
import { api, type DashboardMetrics, type ProgramCount } from "@/lib/api";
import Link from "next/link";

export default function AdminDashboardPage() {
    const { getToken, isLoaded } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState(30);

    const loadMetrics = async () => {
        if (!isLoaded) return;

        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            if (!token) throw new Error("Not authenticated");

            const data = await api.admin.getDashboardMetrics(token, period);
            setMetrics(data);
        } catch (err) {
            console.error("Failed to load metrics:", err);
            setError(err instanceof Error ? err.message : "Failed to load metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, [isLoaded, period]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>No Data Available</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </header>
            <div className="flex-1 flex-col overflow-y-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
                        <p className="text-muted-foreground">Monitor system performance and user activity</p>
                    </div>
                    <Tabs value={period.toString()} onValueChange={(v) => setPeriod(Number(v))}>
                        <TabsList>
                            <TabsTrigger value="7">7 Days</TabsTrigger>
                            <TabsTrigger value="30">30 Days</TabsTrigger>
                            <TabsTrigger value="90">90 Days</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_users}</div>
                            <p className="text-xs text-muted-foreground">
                                +{metrics.new_users_period} in last {period} days
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.active_users}</div>
                            <p className="text-xs text-muted-foreground">
                                Active in last 7 days
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_recommendations}</div>
                            <p className="text-xs text-muted-foreground">
                                {metrics.recommendations_with_feedback} with feedback
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.avg_feedback_rating.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                Out of 5.0 stars
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Stats */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Overview</CardTitle>
                            <CardDescription>Key system metrics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Profiles</span>
                                <Badge variant="secondary">{metrics.total_profiles}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Sessions</span>
                                <Badge variant="secondary">{metrics.total_sessions}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Low-Rated Recommendations</span>
                                <Badge variant={metrics.low_rated_recommendations_count > 0 ? "destructive" : "secondary"}>
                                    {metrics.low_rated_recommendations_count}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Top Recommended Programs</CardTitle>
                                <CardDescription>Most frequently recommended</CardDescription>
                            </div>
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {metrics.top_recommended_programs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {metrics.top_recommended_programs.slice(0, 5).map((program: ProgramCount, index: number) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm truncate flex-1">{program.program}</span>
                                            <Badge variant="outline">{program.count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Navigate to detailed views</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Link href="/dashboard/admin/profiles">
                                <Button variant="outline" className="w-full justify-start">
                                    <Users className="mr-2 h-4 w-4" />
                                    View All Profiles
                                </Button>
                            </Link>
                            <Link href="/dashboard/admin/sessions">
                                <Button variant="outline" className="w-full justify-start">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    View All Sessions
                                </Button>
                            </Link>
                            <Link href="/dashboard/admin/recommendations">
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="mr-2 h-4 w-4" />
                                    View All Recommendations
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts */}
                {metrics.low_rated_recommendations_count > 5 && (
                    <Card className="border-yellow-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-600">
                                <AlertCircle className="h-5 w-5" />
                                Attention Required
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                There are {metrics.low_rated_recommendations_count} recommendations with low ratings (≤2 stars).
                                Consider reviewing these for quality improvements.
                            </p>
                            <Link href="/dashboard/admin/recommendations?max_rating=2">
                                <Button variant="outline" className="mt-4">
                                    Review Low-Rated Recommendations
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
