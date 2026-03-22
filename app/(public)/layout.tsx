import { Nav } from '@/components/ui/nav'
import { Footer } from '@/components/ui/footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  )
}
