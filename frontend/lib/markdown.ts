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
    // Read from the docs folder in the project root (one level up from frontend)
    const frontendDir = process.cwd();
    const projectRoot = path.dirname(frontendDir);
    const docsPath = path.join(projectRoot, 'docs', relativePath);
    
    console.log(`[Markdown Loader] CWD: ${frontendDir}`);
    console.log(`[Markdown Loader] Project Root: ${projectRoot}`);
    console.log(`[Markdown Loader] Looking for: ${docsPath}`);
    console.log(`[Markdown Loader] Relative path: ${relativePath}`);
    
    const fileExists = fs.existsSync(docsPath);
    console.log(`[Markdown Loader] File exists: ${fileExists}`);
    
    if (!fileExists) {
      // Try alternative path - maybe docs are at /docs directly
      const altPath = path.join('/docs', relativePath);
      console.log(`[Markdown Loader] Trying alternative path: ${altPath}`);
      if (fs.existsSync(altPath)) {
        console.log(`[Markdown Loader] Found at alternative path!`);
        const fileContents = fs.readFileSync(altPath, 'utf8');
        const { data, content } = matter(fileContents);
        const markdownAst = unified().use(remarkParse).use(remarkGfm).parse(content);
        const toc = extractTocFromMarkdown(markdownAst);
        return {
          frontmatter: data,
          content,
          toc,
        };
      }
    }
    
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error reading markdown file at path: ${relativePath}`, errorMessage);
    return {
      frontmatter: {},
      content: '# Documentation Not Found\n\nThe requested documentation could not be loaded.',
      toc: [] as TOCItem[],
    };
  }
}
