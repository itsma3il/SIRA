# SIRA Documentation Configuration

This directory contains the centralized configuration for all SIRA documentation.

## Files

### `docs-config.ts`
Single source of truth for all documentation paths, metadata, and navigation structure.

## How to Add New Documentation

1. **Create the markdown file** in the appropriate subdirectory of `/docs`:
   - User Documentation → `/docs/User Documentation/`
   - Developer Documentation → `/docs/Developer Documentation/`
   - Operations Documentation → `/docs/Operations Documentation/`
   - Management/Planning → `/docs/Planning/`

2. **Add entry to `DOCS_REGISTRY`** in `lib/docs-config.ts`:
   ```typescript
   {
     title: 'Your Page Title',
     path: '/docs/section/page-slug',
     category: 'Developer' | 'User' | 'Operations' | 'Management',
     description: 'Brief description for search',
     icon: IconComponent, // Import from lucide-react
     markdownPath: 'Developer Documentation/YOUR_FILE.md',
     keywords: ['keyword1', 'keyword2', 'keyword3'],
     section: 'Developer' | 'Operations' | 'Management' | 'Getting Started',
   }
   ```

3. **Create the Next.js page** at `app/docs/section/page-slug/page.tsx`:
   ```typescript
   import fs from "fs";
   import path from "path";
   import { MarkdownRenderer } from "@/components/markdown-renderer";

   export default function YourPage() {
     const docsPath = path.join(
       process.cwd(),
       "../docs/Developer Documentation/YOUR_FILE.md"
     );
     const content = fs.readFileSync(docsPath, "utf-8");
     return <MarkdownRenderer content={content} />;
   }
   ```

4. **Test the integration**:
   - Search should find your page (Ctrl+K)
   - Sidebar should show your page in the correct section
   - Direct navigation to your path should work

## Documentation Structure

```
/docs (root - markdown files)
├── User Documentation/
├── Developer Documentation/
├── Operations Documentation/
└── Planning/

/app/docs (Next.js pages)
├── guides/
│   └── user-guide/
├── developer/
│   ├── developer-guide/
│   ├── architecture/
│   ├── api-reference/
│   ├── database/
│   ├── tech-stack/
│   └── testing/
├── operations/
│   ├── deployment/
│   ├── operations-manual/
│   ├── security/
│   └── incident-runbooks/
└── management/
    ├── project-status/
    └── development-plan/
```

## Features

- **Centralized Configuration**: Single file controls all doc routes and metadata
- **Type-Safe**: Full TypeScript support with `DocMetadata` interface
- **Searchable**: Keyword-based search with category filtering
- **Icon System**: Uses Lucide React icons for visual identification
- **Automatic Sidebar**: Sidebar auto-generates from `SIDEBAR_SECTIONS`
- **No Emojis**: Professional documentation without emoji clutter

## Helper Functions

### `getDocByPath(path: string)`
Returns documentation metadata for a given route path.

### `getDocByMarkdownPath(markdownPath: string)`
Returns documentation metadata for a given markdown file path.

### `searchDocs(query: string)`
Searches documentation by title, description, and keywords.

### `getDocsByCategory()`
Returns all documentation grouped by category (User, Developer, Operations, Management).
