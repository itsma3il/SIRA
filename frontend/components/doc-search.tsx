// Documentation Search Component with Ctrl+K support
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, FileText, Book, Code, Shield, Settings, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocResult {
  title: string;
  path: string;
  category: 'User' | 'Developer' | 'Operations' | 'Management';
  description: string;
  icon: React.ReactNode;
}

const DOCUMENTATION: DocResult[] = [
  // User Documentation
  {
    title: 'User Guide',
    path: '/docs/USER_GUIDE.md',
    category: 'User',
    description: 'Complete user manual with tutorials and how-to guides',
    icon: <Book className="h-4 w-4" />,
  },

  // Developer Documentation
  {
    title: 'Developer Guide',
    path: '/docs/DEVELOPER_GUIDE.md',
    category: 'Developer',
    description: 'Setup, coding standards, and development workflow',
    icon: <Code className="h-4 w-4" />,
  },
  {
    title: 'Architecture',
    path: '/docs/ARCHITECTURE.md',
    category: 'Developer',
    description: 'System architecture and component interactions',
    icon: <Code className="h-4 w-4" />,
  },
  {
    title: 'API Reference',
    path: '/docs/API_REFERENCE.md',
    category: 'Developer',
    description: 'Complete REST API documentation',
    icon: <Code className="h-4 w-4" />,
  },
  {
    title: 'Database Schema',
    path: '/docs/DATABASE.md',
    category: 'Developer',
    description: 'Database structure and relationships',
    icon: <Code className="h-4 w-4" />,
  },
  {
    title: 'Tech Stack',
    path: '/docs/TECH_STACK.md',
    category: 'Developer',
    description: 'Technologies used and integration details',
    icon: <Code className="h-4 w-4" />,
  },
  {
    title: 'Testing Guide',
    path: '/docs/TESTING.md',
    category: 'Developer',
    description: 'Test strategy, infrastructure, and best practices',
    icon: <Code className="h-4 w-4" />,
  },

  // Operations Documentation
  {
    title: 'Deployment Guide',
    path: '/docs/DEPLOYMENT.md',
    category: 'Operations',
    description: 'Production deployment procedures',
    icon: <Settings className="h-4 w-4" />,
  },
  {
    title: 'Operations Manual',
    path: '/docs/OPERATIONS.md',
    category: 'Operations',
    description: 'Day-to-day operations and maintenance',
    icon: <Settings className="h-4 w-4" />,
  },
  {
    title: 'Security Guide',
    path: '/docs/SECURITY.md',
    category: 'Operations',
    description: 'Comprehensive security documentation',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    title: 'Incident Runbooks',
    path: '/docs/INCIDENT_RUNBOOKS.md',
    category: 'Operations',
    description: 'Emergency response procedures',
    icon: <Shield className="h-4 w-4" />,
  },

  // Management Documentation
  {
    title: 'Project Status',
    path: '/docs/PROJECT_STATUS.md',
    category: 'Management',
    description: 'Executive summary, metrics, and roadmap',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: 'Documentation Index',
    path: '/docs/INDEX.md',
    category: 'Management',
    description: 'Complete documentation navigation',
    icon: <FileText className="h-4 w-4" />,
  },
];

export function DocSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter docs based on search query
  const filteredDocs = useMemo(() => {
    if (!query.trim()) return DOCUMENTATION;

    const lowerQuery = query.toLowerCase();
    return DOCUMENTATION.filter(
      (doc) =>
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.description.toLowerCase().includes(lowerQuery) ||
        doc.category.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  // Handle Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle arrow navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredDocs.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredDocs[selectedIndex]) {
        e.preventDefault();
        handleSelectDoc(filteredDocs[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredDocs, selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelectDoc = useCallback((doc: DocResult) => {
    // Open doc in new tab or navigate to it
    const fullPath = `https://github.com/your-org/sira/blob/main${doc.path}`;
    window.open(fullPath, '_blank');
    setIsOpen(false);
    setQuery('');
  }, []);

  const getCategoryColor = (category: DocResult['category']) => {
    switch (category) {
      case 'User':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'Developer':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'Operations':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'Management':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-md hover:border-primary"
      >
        <Search className="h-4 w-4" />
        <span>Search docs...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-lg font-semibold">Search Documentation</DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search..."
                className="pl-9 pr-9"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <ScrollArea className="max-h-[400px]">
            {filteredDocs.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No documentation found</p>
              </div>
            ) : (
              <div className="px-2 pb-2">
                {filteredDocs.map((doc, index) => (
                  <button
                    key={doc.path}
                    onClick={() => handleSelectDoc(doc)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{doc.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{doc.title}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(
                              doc.category
                            )}`}
                          >
                            {doc.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="px-4 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd>
                Close
              </span>
            </div>
            <span>{filteredDocs.length} results</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
