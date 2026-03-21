export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // Phase 3 adds: Firebase Auth guard — redirect to /login if unauthenticated
  // Phase 3 adds: portal nav, user context provider
  return <>{children}</>
}
