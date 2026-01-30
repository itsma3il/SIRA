import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployment Guide • SIRA Documentation",
  description: "Production deployment procedures and best practices.",
};

export default async function DeploymentPage() {
  const docsPath = path.join(process.cwd(), "../docs/Operations Documentation/DEPLOYMENT.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
