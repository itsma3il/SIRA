import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "User Guides • SIRA Documentation",
  description: "User guides and tutorials for SIRA",
};

export default function GuidesDocsPage() {
  const sections = [
    {
      title: "User Guide",
      description: "Complete guide for end users",
      href: "/docs/guides/user-guide",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Guides</h1>
        <p className="text-muted-foreground">
          Tutorials and guides for using SIRA
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
