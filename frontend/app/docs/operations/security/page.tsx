import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Hardening • SIRA Documentation",
  description: "Security features and best practices implementation.",
};

export default async function SecurityPage() {
  const docsPath = path.join(process.cwd(), "../docs/Operations Documentation/SECURITY.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
