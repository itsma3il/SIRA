import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testing Guide • SIRA Documentation",
  description: "Test suite documentation and coverage reports.",
};

export default async function TestingPage() {
  const docsPath = path.join(process.cwd(), "../docs/technical/testing-implementation.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
