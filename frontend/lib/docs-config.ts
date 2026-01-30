/**
 * Centralized Documentation Configuration
 * Single source of truth for all documentation paths, metadata, and navigation
 */

import { 
  Book, 
  Code, 
  Settings, 
  Shield, 
  FileText, 
  Database,
  Layers,
  TestTube,
  Rocket,
  Activity,
  BarChart,
  FolderTree,
  LucideIcon
} from 'lucide-react';

export interface DocMetadata {
  title: string;
  path: string;
  category: 'User' | 'Developer' | 'Operations' | 'Management';
  description: string;
  icon: LucideIcon;
  markdownPath: string; // Path to the actual markdown file in docs folder
  keywords: string[]; // For search optimization
  section: string; // For sidebar organization
}

export interface DocSection {
  title: string;
  items: DocMetadata[];
}

/**
 * Complete documentation registry
 * Maps all documentation pages to their metadata and file paths
 */
export const DOCS_REGISTRY: DocMetadata[] = [
  // User Documentation
  {
    title: 'User Guide',
    path: '/docs/guides/user-guide',
    category: 'User',
    description: 'Complete user manual with tutorials and how-to guides',
    icon: Book,
    markdownPath: 'User Documentation/USER_GUIDE.md',
    keywords: ['user', 'guide', 'tutorial', 'getting started', 'how to'],
    section: 'Getting Started',
  },

  // Developer Documentation
  {
    title: 'Developer Guide',
    path: '/docs/developer/developer-guide',
    category: 'Developer',
    description: 'Setup, coding standards, and development workflow',
    icon: Code,
    markdownPath: 'Developer Documentation/DEVELOPER_GUIDE.md',
    keywords: ['developer', 'setup', 'coding standards', 'workflow', 'contributing'],
    section: 'Developer',
  },
  {
    title: 'Architecture',
    path: '/docs/developer/architecture',
    category: 'Developer',
    description: 'System architecture and component interactions',
    icon: Layers,
    markdownPath: 'Developer Documentation/ARCHITECTURE.md',
    keywords: ['architecture', 'system design', 'components', 'structure'],
    section: 'Developer',
  },
  {
    title: 'API Reference',
    path: '/docs/developer/api-reference',
    category: 'Developer',
    description: 'Complete REST API documentation',
    icon: FileText,
    markdownPath: 'Developer Documentation/API_REFERENCE.md',
    keywords: ['api', 'rest', 'endpoints', 'reference', 'integration'],
    section: 'Developer',
  },
  {
    title: 'Database Schema',
    path: '/docs/developer/database',
    category: 'Developer',
    description: 'Database structure and relationships',
    icon: Database,
    markdownPath: 'Developer Documentation/DATABASE.md',
    keywords: ['database', 'schema', 'models', 'relations', 'sql'],
    section: 'Developer',
  },
  {
    title: 'Tech Stack',
    path: '/docs/developer/tech-stack',
    category: 'Developer',
    description: 'Technologies used and integration details',
    icon: Layers,
    markdownPath: 'Developer Documentation/TECH_STACK.md',
    keywords: ['tech stack', 'technologies', 'frameworks', 'tools'],
    section: 'Developer',
  },
  {
    title: 'Testing Guide',
    path: '/docs/developer/testing',
    category: 'Developer',
    description: 'Test strategy, infrastructure, and best practices',
    icon: TestTube,
    markdownPath: 'Developer Documentation/TESTING.md',
    keywords: ['testing', 'unit tests', 'integration', 'e2e', 'quality'],
    section: 'Developer',
  },
  {
    title: 'Architecture Change: Recommendations',
    path: '/docs/developer/recommendation-architecture-change',
    category: 'Developer',
    description: 'Major change: Recommendations now chat-integrated',
    icon: Activity,
    markdownPath: 'Developer Documentation/RECOMMENDATION_ARCHITECTURE_CHANGE.md',
    keywords: ['recommendation', 'architecture', 'migration', 'chat integration', 'change'],
    section: 'Developer',
  },

  // Operations Documentation
  {
    title: 'Deployment Guide',
    path: '/docs/operations/deployment',
    category: 'Operations',
    description: 'Production deployment procedures',
    icon: Rocket,
    markdownPath: 'Operations Documentation/DEPLOYMENT.md',
    keywords: ['deployment', 'production', 'docker', 'ci/cd', 'infrastructure'],
    section: 'Operations',
  },
  {
    title: 'Operations Manual',
    path: '/docs/operations/operations-manual',
    category: 'Operations',
    description: 'Day-to-day operations and maintenance',
    icon: Settings,
    markdownPath: 'Operations Documentation/OPERATIONS.md',
    keywords: ['operations', 'maintenance', 'monitoring', 'logs'],
    section: 'Operations',
  },
  {
    title: 'Security Guide',
    path: '/docs/operations/security',
    category: 'Operations',
    description: 'Comprehensive security documentation',
    icon: Shield,
    markdownPath: 'Operations Documentation/SECURITY.md',
    keywords: ['security', 'authentication', 'authorization', 'vulnerabilities'],
    section: 'Operations',
  },
  {
    title: 'Incident Runbooks',
    path: '/docs/operations/incident-runbooks',
    category: 'Operations',
    description: 'Emergency response procedures',
    icon: Activity,
    markdownPath: 'Operations Documentation/INCIDENT_RUNBOOKS.md',
    keywords: ['incidents', 'emergencies', 'troubleshooting', 'runbooks'],
    section: 'Operations',
  },

  // Management Documentation
  {
    title: 'Project Status',
    path: '/docs/management/project-status',
    category: 'Management',
    description: 'Current project status and milestones',
    icon: BarChart,
    markdownPath: 'PROJECT_STATUS.md',
    keywords: ['status', 'progress', 'milestones', 'roadmap'],
    section: 'Management',
  },
  {
    title: 'Development Plan',
    path: '/docs/management/development-plan',
    category: 'Management',
    description: 'Detailed development roadmap and planning',
    icon: FolderTree,
    markdownPath: 'Planning/COMPLETE_DEVELOPMENT_PLAN.md',
    keywords: ['plan', 'roadmap', 'timeline', 'phases', 'strategy'],
    section: 'Management',
  },
];

/**
 * Sidebar navigation configuration
 * Organized by sections for easy navigation
 */
export const SIDEBAR_SECTIONS: DocSection[] = [
  {
    title: 'Getting Started',
    items: DOCS_REGISTRY.filter(doc => doc.section === 'Getting Started'),
  },
  {
    title: 'Developer',
    items: DOCS_REGISTRY.filter(doc => doc.section === 'Developer'),
  },
  {
    title: 'Operations',
    items: DOCS_REGISTRY.filter(doc => doc.section === 'Operations'),
  },
  {
    title: 'Management',
    items: DOCS_REGISTRY.filter(doc => doc.section === 'Management'),
  },
];

/**
 * Get documentation metadata by path
 */
export function getDocByPath(path: string): DocMetadata | undefined {
  return DOCS_REGISTRY.find(doc => doc.path === path);
}

/**
 * Get documentation metadata by markdown path
 */
export function getDocByMarkdownPath(markdownPath: string): DocMetadata | undefined {
  return DOCS_REGISTRY.find(doc => doc.markdownPath === markdownPath);
}

/**
 * Search documentation by query
 */
export function searchDocs(query: string): DocMetadata[] {
  const lowerQuery = query.toLowerCase();
  return DOCS_REGISTRY.filter(doc => 
    doc.title.toLowerCase().includes(lowerQuery) ||
    doc.description.toLowerCase().includes(lowerQuery) ||
    doc.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all documentation grouped by category
 */
export function getDocsByCategory() {
  return {
    User: DOCS_REGISTRY.filter(doc => doc.category === 'User'),
    Developer: DOCS_REGISTRY.filter(doc => doc.category === 'Developer'),
    Operations: DOCS_REGISTRY.filter(doc => doc.category === 'Operations'),
    Management: DOCS_REGISTRY.filter(doc => doc.category === 'Management'),
  };
}
