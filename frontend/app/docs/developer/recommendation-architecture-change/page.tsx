import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function RecommendationArchitectureChangePage() {
  const docsPath = path.join(
    process.cwd(),
    "../docs/Developer Documentation/RECOMMENDATION_ARCHITECTURE_CHANGE.md"
  );
  const content = fs.readFileSync(docsPath, "utf-8");
  return <MarkdownRenderer content={content} />;
}
