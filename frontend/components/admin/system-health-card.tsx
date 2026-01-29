"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, HardDrive, MemoryStick, Activity, Loader2, AlertCircle } from "lucide-react";

interface SystemHealth {
  status: "healthy" | "degraded" | "error";
  timestamp: string;
  cpu: {
    usage_percent: number;
    count: number;
  };
  memory: {
    usage_percent: number;
    available_gb: number;
    total_gb: number;
  };
  disk: {
    usage_percent: number;
    free_gb: number;
    total_gb: number;
  };
}

interface SystemHealthCardProps {
  refreshInterval?: number; // in milliseconds
}

export function SystemHealthCard({ refreshInterval = 30000 }: SystemHealthCardProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/health/system`
      );
      if (!response.ok) throw new Error("Failed to fetch system health");
      const data = await response.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      default:
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "text-red-600";
    if (percent >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            System Health Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || "Unable to load system health"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Real-time resource monitoring</CardDescription>
          </div>
          {getStatusBadge(health.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">CPU</span>
            </div>
            <span className={`text-sm font-bold ${getUsageColor(health.cpu.usage_percent)}`}>
              {health.cpu.usage_percent.toFixed(1)}%
            </span>
          </div>
          <Progress value={health.cpu.usage_percent} className="h-2" />
          <p className="text-xs text-muted-foreground">{health.cpu.count} cores</p>
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <span className={`text-sm font-bold ${getUsageColor(health.memory.usage_percent)}`}>
              {health.memory.usage_percent.toFixed(1)}%
            </span>
          </div>
          <Progress value={health.memory.usage_percent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {health.memory.available_gb.toFixed(1)} GB available of {health.memory.total_gb.toFixed(1)} GB
          </p>
        </div>

        {/* Disk Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Disk</span>
            </div>
            <span className={`text-sm font-bold ${getUsageColor(health.disk.usage_percent)}`}>
              {health.disk.usage_percent.toFixed(1)}%
            </span>
          </div>
          <Progress value={health.disk.usage_percent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {health.disk.free_gb.toFixed(1)} GB free of {health.disk.total_gb.toFixed(1)} GB
          </p>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Last updated: {new Date(health.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
