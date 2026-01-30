import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { extractTocFromMarkdown } from './remark-extract-toc';
import type { TOCItem } from './remark-extract-toc';

export async function getMarkdownContent(relativePath: string) {
  try {
    // Read from the docs folder in the project root
    const docsPath = path.join(process.cwd(), '..', 'docs', relativePath);
    const fileContents = fs.readFileSync(docsPath, 'utf8');
    
    const { data, content } = matter(fileContents);

    const markdownAst = unified().use(remarkParse).use(remarkGfm).parse(content);
    const toc = extractTocFromMarkdown(markdownAst);

    return {
      frontmatter: data,
      content,
      toc,
    };
  } catch (error) {
    console.error(`Error reading markdown file: ${relativePath}`, error);
    return {
      frontmatter: {},
      content: '# Documentation Not Found\n\nThe requested documentation could not be loaded.',
      toc: [] as TOCItem[],
    };
  }
}
