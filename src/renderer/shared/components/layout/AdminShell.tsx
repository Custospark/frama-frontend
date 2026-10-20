import { useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import {
  CONTENT_MARGIN_COLLAPSED_CLASS,
  CONTENT_MARGIN_EXPANDED_CLASS,
} from './layoutConstants';

const LG_BREAKPOINT = 1024;

/**
 * Frama app shell - fixed left sidebar + sticky header (profile only) + a
 * scrollable main workspace and brand footer, mirroring the Custosell layout.
 * Pages keep the `<AdminShell>{children}</AdminShell>` API.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  // Desktop: collapse the pinned rail. Mobile: slide the drawer in/out.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth >= LG_BREAKPOINT) {
      setCollapsed((c) => !c);
    } else {
      setMobileOpen((o) => !o);
    }
  };

  const sidebarLabel =
    window.innerWidth >= LG_BREAKPOINT
      ? collapsed
        ? 'Show sidebar'
        : 'Hide sidebar'
      : mobileOpen
        ? 'Hide sidebar'
        : 'Show sidebar';

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      {mobileOpen && (
        <div
          className="absolute inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} collapsed={collapsed} />

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-200',
          collapsed ? CONTENT_MARGIN_COLLAPSED_CLASS : CONTENT_MARGIN_EXPANDED_CLASS,
        )}
      >
        <AppHeader onToggleSidebar={handleToggleSidebar} sidebarLabel={sidebarLabel} />

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
