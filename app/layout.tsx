import type { Metadata } from 'next'
import { Inter, Work_Sans } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

// Using Work Sans as Satoshi alternative (similar geometric characteristics)
const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FlowstateIt - AI Automation Agency | Transform Your Business',
  description:
    'Leading AI automation agency specializing in Agentic AI, Voice Automation, Workflow Bots, and SOP Automation. Transform your business operations with cutting-edge technology.',
  keywords:
    'AI automation, agentic AI, voice automation, workflow automation, SOP automation, business automation, AI consulting, fractional CTO, fractional CAIO',
  authors: [{ name: 'FlowstateIt' }],
  creator: 'FlowstateIt',
  publisher: 'FlowstateIt',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://flowstateit.co.uk'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FlowstateIt - AI Automation Agency',
    description: 'Transform your business operations with cutting-edge AI automation solutions',
    url: 'https://flowstateit.co.uk',
    siteName: 'FlowstateIt',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FlowstateIt - AI Automation Agency',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowstateIt - AI Automation Agency',
    description: 'Transform your business operations with cutting-edge AI automation solutions',
    images: ['/og-image.png'],
    creator: '@flowstateit',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${workSans.variable}`}>
      <head>
        {/* Organization Schema */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'FlowstateIt',
              url: 'https://flowstateit.co.uk',
              logo: 'https://flowstateit.co.uk/logo.png',
              description: 'Leading AI automation agency specializing in business transformation',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'London',
                addressCountry: 'GB',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+44-20-1234-5678',
                contactType: 'sales',
                areaServed: 'GB',
                availableLanguage: 'English',
              },
              sameAs: [
                'https://linkedin.com/company/flowstate-it',
                'https://twitter.com/flowstateit',
                'https://github.com/flowstate-it',
              ],
            }),
          }}
        />

        {/* Service Schema */}
        <Script
          id="service-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              serviceType: 'AI Automation Consulting',
              provider: {
                '@type': 'Organization',
                name: 'FlowstateIt',
              },
              areaServed: {
                '@type': 'Country',
                name: 'United Kingdom',
              },
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'AI Automation Services',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Agentic AI & Voice Automation',
                      description: 'Deploy intelligent AI agents for autonomous task handling',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Workflow Automation',
                      description: 'Streamline business processes with custom automation',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Lead Generation Automation',
                      description: 'Automate lead scoring, enrichment, and nurturing',
                    },
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'SOP Automation',
                      description:
                        'Transform standard operating procedures into automated workflows',
                    },
                  },
                ],
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
