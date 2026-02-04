import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Management • SIRA Documentation",
  description: "Project management and planning documentation",
};

export default function ManagementDocsPage() {
  const sections = [
    {
      title: "Development Plan",
      description: "Complete development roadmap and planning",
      href: "/docs/management/development-plan",
    },
    {
      title: "Project Status",
      description: "Current project status and progress tracking",
      href: "/docs/management/project-status",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Management</h1>
        <p className="text-muted-foreground">
          Project planning and status documentation
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
