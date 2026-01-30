import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function getMarkdownContent(relativePath: string) {
  try {
    // Read from the docs folder in the project root
    const docsPath = path.join(process.cwd(), '..', 'docs', relativePath);
    const fileContents = fs.readFileSync(docsPath, 'utf8');
    
    const { data, content } = matter(fileContents);
    
    return {
      frontmatter: data,
      content,
    };
  } catch (error) {
    console.error(`Error reading markdown file: ${relativePath}`, error);
    return {
      frontmatter: {},
      content: '# Documentation Not Found\n\nThe requested documentation could not be loaded.',
    };
  }
}

export function extractHeadings(markdown: string) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { level: number; text: string; id: string }[] = [];
  
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    headings.push({ level, text, id });
  }
  
  return headings;
}
