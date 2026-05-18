import { BottomNav } from '@/components/layout/bottom-nav';

/**
 * App shell layout — wraps all authenticated app routes.
 * Provides the BottomNav anchored at the bottom (safe-area aware).
 * The main content area is scrollable above the nav.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
