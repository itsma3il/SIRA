"use client";

import { useMemo } from "react";
import { Bar, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RecommendationChartsProps {
  structuredData: {
    match_scores?: number[];
    program_names?: string[];
    difficulty_levels?: number[];
    tuition_fees?: number[];
  };
}

export function RecommendationCharts({ structuredData }: RecommendationChartsProps) {
  const { match_scores = [], program_names = [], difficulty_levels = [], tuition_fees = [] } = structuredData;

  // Truncate long program names for labels
  const labels = useMemo(
    () => program_names.map((name) => (name.length > 30 ? name.substring(0, 30) + "..." : name)),
    [program_names]
  );

  // Match Scores Chart
  const matchScoresData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Match Score (%)",
          data: match_scores,
          backgroundColor: match_scores.map((score) =>
            score >= 80 ? "rgba(16, 185, 129, 0.8)" : score >= 60 ? "rgba(245, 158, 11, 0.8)" : "rgba(239, 68, 68, 0.8)"
          ),
          borderColor: match_scores.map((score) =>
            score >= 80 ? "rgb(16, 185, 129)" : score >= 60 ? "rgb(245, 158, 11)" : "rgb(239, 68, 68)"
          ),
          borderWidth: 2,
        },
      ],
    }),
    [labels, match_scores]
  );

  // Tuition Fees Chart
  const tuitionData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Annual Tuition (MAD)",
          data: tuition_fees,
          backgroundColor: "rgba(99, 102, 241, 0.8)",
          borderColor: "rgb(99, 102, 241)",
          borderWidth: 2,
        },
      ],
    }),
    [labels, tuition_fees]
  );

  // Radar Chart for Comparison
  const radarData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Match Score",
          data: match_scores,
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          borderColor: "rgb(16, 185, 129)",
          pointBackgroundColor: "rgb(16, 185, 129)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(16, 185, 129)",
        },
        {
          label: "Difficulty (×10)",
          data: difficulty_levels.map((d) => d * 10),
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          borderColor: "rgb(239, 68, 68)",
          pointBackgroundColor: "rgb(239, 68, 68)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(239, 68, 68)",
        },
      ],
    }),
    [labels, match_scores, difficulty_levels]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  if (match_scores.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No visualization data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="match" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="match">Match Scores</TabsTrigger>
          <TabsTrigger value="tuition">Tuition</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="match" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program Match Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={matchScoresData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tuition" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Annual Tuition Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={tuitionData} options={chartOptions} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                  <span className="text-muted-foreground">Lowest:</span>
                  <span className="font-semibold">{Math.min(...tuition_fees).toLocaleString()} MAD</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                  <span className="text-muted-foreground">Highest:</span>
                  <span className="font-semibold">{Math.max(...tuition_fees).toLocaleString()} MAD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Programs Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <Radar data={radarData} options={radarOptions} />
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p>• <span className="text-emerald-600 font-medium">Match Score</span>: How well the program aligns with your profile</p>
                <p>• <span className="text-red-600 font-medium">Difficulty</span>: Admission competitiveness (scaled ×10 for visibility)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Difficulty & Cost Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Average Difficulty</p>
              <p className="text-2xl font-bold">
                {difficulty_levels.length > 0
                  ? (difficulty_levels.reduce((a, b) => a + b, 0) / difficulty_levels.length).toFixed(1)
                  : "N/A"}
                /10
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Average Tuition</p>
              <p className="text-2xl font-bold">
                {tuition_fees.length > 0
                  ? Math.round(tuition_fees.reduce((a, b) => a + b, 0) / tuition_fees.length).toLocaleString()
                  : "N/A"}
                <span className="text-sm font-normal text-muted-foreground ml-1">MAD</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
