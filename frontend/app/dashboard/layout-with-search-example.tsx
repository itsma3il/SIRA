// Example usage in dashboard layout
import { DocSearch } from '@/components/doc-search';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function DashboardLayoutWithSearch({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with Search */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">SIRA</h1>
            <Breadcrumbs />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Documentation Search - Primary Feature */}
            <DocSearch />
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
