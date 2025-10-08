import type { Metadata } from 'next'
import { Inter, Work_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

// Using Work Sans as geometric heading font
const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Payload CMS Website',
  description: 'Website powered by Payload CMS - The Next.js native headless CMS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${workSans.variable}`}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
