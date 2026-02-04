import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Operations • SIRA Documentation",
  description: "Operations and deployment documentation for SIRA",
};

export default function OperationsDocsPage() {
  const sections = [
    {
      title: "Deployment Guide",
      description: "Instructions for deploying SIRA to production",
      href: "/docs/operations/deployment",
    },
    {
      title: "Operations Manual",
      description: "Day-to-day operations and maintenance procedures",
      href: "/docs/operations/operations-manual",
    },
    {
      title: "Security",
      description: "Security hardening and best practices",
      href: "/docs/operations/security",
    },
    {
      title: "Incident Runbooks",
      description: "Procedures for handling common incidents",
      href: "/docs/operations/incident-runbooks",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Operations Documentation</h1>
        <p className="text-muted-foreground">
          Deployment, operations, and maintenance procedures for SIRA
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer group">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground">{section.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
