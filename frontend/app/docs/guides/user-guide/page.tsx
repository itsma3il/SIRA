import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function UserGuidePage() {
  const docsPath = path.join(
    process.cwd(),
    "../docs/User Documentation/USER_GUIDE.md"
  );
  const content = fs.readFileSync(docsPath, "utf-8");
  return <MarkdownRenderer content={content} />;
}
