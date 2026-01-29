import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Guide • SIRA Documentation",
  description: "Complete guide for students using SIRA to find university programs.",
};

export default async function UserGuidePage() {
  const docsPath = path.join(process.cwd(), "../docs/guides/USER_GUIDE.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
