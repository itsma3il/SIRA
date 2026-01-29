import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference • SIRA Documentation",
  description: "Complete API endpoint documentation with examples.",
};

export default async function ApiReferencePage() {
  const docsPath = path.join(process.cwd(), "../docs/guides/API_REFERENCE.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
