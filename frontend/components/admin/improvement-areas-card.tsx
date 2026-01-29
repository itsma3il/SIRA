"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, CheckCircle2, Lightbulb } from "lucide-react";

interface ImprovementArea {
  area: string;
  severity: "high" | "medium" | "low";
  description: string;
  suggestion: string;
}

interface ImprovementAreasProps {
  data: {
    total_issues_identified: number;
    issues: ImprovementArea[];
    low_rated_sample_size: number;
    analysis_date: string;
  };
}

export function ImprovementAreasCard({ data }: ImprovementAreasProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <Info className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSeverityVariant = (severity: string): "destructive" | "default" => {
    return severity === "high" ? "destructive" : "default";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quality Improvement Areas</CardTitle>
            <CardDescription>
              Automated analysis based on {data.low_rated_sample_size} low-rated recommendations
            </CardDescription>
          </div>
          <Badge variant={data.total_issues_identified === 0 ? "outline" : "secondary"}>
            {data.total_issues_identified} {data.total_issues_identified === 1 ? "issue" : "issues"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.total_issues_identified === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>All Systems Running Well</AlertTitle>
            <AlertDescription>
              No significant quality issues detected. Keep monitoring feedback trends.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {data.issues.map((issue, index) => (
              <Alert key={index} variant={getSeverityVariant(issue.severity)}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getSeverityColor(issue.severity)}`}>
                    {getSeverityIcon(issue.severity)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTitle className="mb-0">
                        {issue.area.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </AlertTitle>
                      <Badge variant="outline" className="text-xs">
                        {issue.severity}
                      </Badge>
                    </div>
                    <AlertDescription>
                      <p className="mb-2">{issue.description}</p>
                      <div className="mt-3 rounded-md bg-muted/50 p-3">
                        <p className="text-sm font-medium flex items-center gap-2 mb-1">
                          <Lightbulb className="h-3 w-3" />
                          Suggestion:
                        </p>
                        <p className="text-sm">{issue.suggestion}</p>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          Last analyzed: {new Date(data.analysis_date).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
