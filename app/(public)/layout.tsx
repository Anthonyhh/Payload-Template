export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // Phase 2 adds: <Nav />, <Footer /> components
  // Phase 3 adds: PostHog analytics provider
  return <>{children}</>
}
