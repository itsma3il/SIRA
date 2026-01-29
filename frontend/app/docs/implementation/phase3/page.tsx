import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phase 3: RAG Infrastructure • SIRA Documentation",
  description: "RAG infrastructure implementation details and documentation.",
};

export default async function Phase3Page() {
  const docsPath = path.join(process.cwd(), "../docs/implementation/PHASE3_SUMMARY.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
