# Documentation System - Quick Reference

## Add New Documentation (3 Steps)

### Step 1: Create Markdown File
```bash
# Place in appropriate folder
/docs/Developer Documentation/YOUR_FILE.md
```

### Step 2: Add to Config
```typescript
// In lib/docs-config.ts → DOCS_REGISTRY array
{
  title: 'Your Title',
  path: '/docs/section/page-slug',
  category: 'Developer', // or User, Operations, Management
  description: 'Brief description',
  icon: Code, // Import from lucide-react
  markdownPath: 'Developer Documentation/YOUR_FILE.md',
  keywords: ['keyword1', 'keyword2'],
  section: 'Developer', // For sidebar grouping
}
```

### Step 3: Create Next.js Page
```typescript
// In app/docs/section/page-slug/page.tsx
import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function YourPage() {
  const docsPath = path.join(process.cwd(), "../docs/Developer Documentation/YOUR_FILE.md");
  const content = fs.readFileSync(docsPath, "utf-8");
  return <MarkdownRenderer content={content} />;
}
```

## Configuration Structure

```typescript
interface DocMetadata {
  title: string;          // Display name
  path: string;           // Next.js route
  category: string;       // Badge color
  description: string;    // Search description
  icon: LucideIcon;      // Icon component
  markdownPath: string;   // Relative to /docs folder
  keywords: string[];     // For search
  section: string;        // Sidebar grouping
}
```

## Helper Functions

```typescript
import { 
  getDocByPath, 
  getDocByMarkdownPath, 
  searchDocs, 
  getDocsByCategory 
} from '@/lib/docs-config';

// Get doc by route
const doc = getDocByPath('/docs/developer/api-reference');

// Get doc by markdown file
const doc = getDocByMarkdownPath('Developer Documentation/API_REFERENCE.md');

// Search
const results = searchDocs('authentication security');

// Get all by category
const { Developer, Operations } = getDocsByCategory();
```

## Current Routes

| Route | Markdown File | Category |
|-------|---------------|----------|
| `/docs/guides/user-guide` | User Documentation/USER_GUIDE.md | User |
| `/docs/developer/developer-guide` | Developer Documentation/DEVELOPER_GUIDE.md | Developer |
| `/docs/developer/architecture` | Developer Documentation/ARCHITECTURE.md | Developer |
| `/docs/developer/api-reference` | Developer Documentation/API_REFERENCE.md | Developer |
| `/docs/developer/database` | Developer Documentation/DATABASE.md | Developer |
| `/docs/developer/tech-stack` | Developer Documentation/TECH_STACK.md | Developer |
| `/docs/developer/testing` | Developer Documentation/TESTING.md | Developer |
| `/docs/operations/deployment` | Operations Documentation/DEPLOYMENT.md | Operations |
| `/docs/operations/operations-manual` | Operations Documentation/OPERATIONS.md | Operations |
| `/docs/operations/security` | Operations Documentation/SECURITY.md | Operations |
| `/docs/operations/incident-runbooks` | Operations Documentation/INCIDENT_RUNBOOKS.md | Operations |
| `/docs/management/project-status` | PROJECT_STATUS.md | Management |
| `/docs/management/development-plan` | Planning/COMPLETE_DEVELOPMENT_PLAN.md | Management |

## Sections for Sidebar

- **Getting Started** → User guides
- **Developer** → Development docs
- **Operations** → Deployment, security, ops
- **Management** → Status, planning

## Icons Available

Import from `lucide-react`:
- `Book` - Guides, manuals
- `Code` - Development
- `Settings` - Operations
- `Shield` - Security
- `Database` - Data
- `Layers` - Architecture
- `TestTube` - Testing
- `Rocket` - Deployment
- `Activity` - Monitoring
- `BarChart` - Analytics
- `FolderTree` - Planning
- `FileText` - General docs

## Testing Checklist

- [ ] Press Ctrl+K, search opens
- [ ] Type search term, results appear
- [ ] Click result, page loads
- [ ] Sidebar shows correct section
- [ ] Active page highlighted in sidebar
- [ ] Markdown renders correctly
- [ ] Code blocks have syntax highlighting
- [ ] Tables format properly
- [ ] Links work (internal + external)

## Tips

- Keep `keywords` array descriptive for better search
- Use consistent `section` names for sidebar grouping
- Match `path` to actual Next.js file location
- Keep `description` under 60 characters
- Choose appropriate icon for visual clarity
- Test search after adding new docs
