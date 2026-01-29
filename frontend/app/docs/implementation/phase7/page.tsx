import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phase 7: Feedback System • SIRA Documentation",
  description: "Feedback and quality monitoring system implementation.",
};

export default async function Phase7Page() {
  const docsPath = path.join(process.cwd(), "../docs/implementation/phase7_implementation_summary.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
