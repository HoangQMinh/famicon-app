import { OfflineDetector } from '@/components/ui/offline-detector';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <OfflineDetector />
      {children}
    </div>
  );
}
