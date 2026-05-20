/**
 * Members screen layout — no BottomNav.
 * This screen is navigated to from Profile and exits via back button only.
 * Overrides the (app) layout's BottomNav injection for this route.
 */
export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
