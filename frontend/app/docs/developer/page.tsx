import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Developer Documentation • SIRA Documentation",
  description: "Developer guides, API reference, and architecture documentation",
};

export default function DeveloperDocsPage() {
  const sections = [
    {
      title: "Getting Started",
      description: "Developer guide and setup instructions",
      href: "/docs/developer/developer-guide",
    },
    {
      title: "Architecture",
      description: "System architecture and design patterns",
      href: "/docs/developer/architecture",
    },
    {
      title: "API Reference",
      description: "Complete API endpoint documentation",
      href: "/docs/developer/api-reference",
    },
    {
      title: "Database Schema",
      description: "Database design and relationships",
      href: "/docs/developer/database",
    },
    {
      title: "Technology Stack",
      description: "Technologies and frameworks used",
      href: "/docs/developer/tech-stack",
    },
    {
      title: "Testing",
      description: "Test suite and coverage documentation",
      href: "/docs/developer/testing",
    },
    {
      title: "Recommendation System",
      description: "Architecture and implementation of recommendations",
      href: "/docs/developer/recommendation-architecture-change",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Developer Documentation</h1>
        <p className="text-muted-foreground">
          Comprehensive guides for developers working with SIRA
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
