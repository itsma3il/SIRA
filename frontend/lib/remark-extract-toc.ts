import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import GithubSlugger from "github-slugger";
import type { Root } from "mdast";

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function extractTocFromMarkdown(markdownAst: Root): TOCItem[] {
  const toc: TOCItem[] = [];
  const slugger = new GithubSlugger();

  visit(markdownAst, "heading", (node) => {
    const text = toString(node).trim();
    if (!text) return;

    const id = slugger.slug(text);

    if (node.depth < 2 || node.depth > 4) return;

    toc.push({
      id,
      text,
      level: node.depth,
    });
  });

  return toc;
}
