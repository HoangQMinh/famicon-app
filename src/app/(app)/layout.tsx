import { BottomNav } from '@/components/layout/bottom-nav';
import { OfflineDetector } from '@/components/ui/offline-detector';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <OfflineDetector />
      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
