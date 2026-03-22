import Link from 'next/link'
import { Linkedin, Twitter } from 'lucide-react'

const servicesLinks = [
  { label: 'AI Strategy', href: '/services/ai-strategy' },
  { label: 'AI Workflow Automation', href: '/services/ai-workflow-automation' },
  { label: 'Agentic AI Systems', href: '/services/agentic-ai' },
  { label: 'Prompt Engineering', href: '/services/prompt-engineering' },
  { label: 'Data & ML', href: '/services/data-ml' },
  { label: 'Fractional CAIO', href: '/services/fractional-caio' },
]

const solutionsLinks = [
  { label: 'Manufacturing', href: '/solutions/manufacturing' },
  { label: 'Financial Services', href: '/solutions/financial-services' },
  { label: 'Healthcare', href: '/solutions/healthcare' },
  { label: 'Legal & Solicitors', href: '/solutions/legal-solicitors' },
  { label: 'Customer Service AI', href: '/solutions/customer-service-automation' },
  { label: 'All Solutions', href: '/solutions' },
]

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Resources', href: '/resources' },
]

const latestInsights = [
  { label: 'How AI Workflow Automation Saves UK SMEs £50K+', href: '/blog/ai-workflow-automation-savings' },
  { label: 'Getting Started with Agentic AI Systems', href: '/blog/agentic-ai-systems-guide' },
  { label: 'AI Readiness: Is Your Business Ready?', href: '/blog/ai-readiness-assessment' },
]

export function Footer() {
  return (
    <footer className="bg-[#14141C] border-t border-[#2A2A38]">
      <div className="container mx-auto px-8 py-16 max-w-screen-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Company info */}
          <div className="lg:col-span-1">
            <p className="font-heading font-bold text-[#F5F5FA] text-lg mb-2">FlowState IT</p>
            <p className="text-sm text-[#A0A0B0] leading-relaxed mb-4">
              AI automation consultancy for UK SMEs and mid-market businesses.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com/company/flowstateit"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="FlowState IT on LinkedIn"
                className="text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/flowstateit"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="FlowState IT on Twitter/X"
                className="text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <p className="text-sm font-semibold text-[#F5F5FA] uppercase tracking-widest mb-3">
              Services
            </p>
            <ul className="space-y-0.5">
              {servicesLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300 block py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Solutions */}
          <div>
            <p className="text-sm font-semibold text-[#F5F5FA] uppercase tracking-widest mb-3">
              Solutions
            </p>
            <ul className="space-y-0.5">
              {solutionsLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300 block py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <p className="text-sm font-semibold text-[#F5F5FA] uppercase tracking-widest mb-3">
              Company
            </p>
            <ul className="space-y-0.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300 block py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Latest Insights */}
          <div>
            <p className="text-sm font-semibold text-[#F5F5FA] uppercase tracking-widest mb-3">
              Latest Insights
            </p>
            <ul className="space-y-2">
              {latestInsights.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300 block py-1 leading-snug"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2A2A38] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#A0A0B0]">
            &copy; 2026 FlowState IT. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-[#A0A0B0]">
            <Link href="/privacy" className="hover:text-[#F5F5FA] transition-colors duration-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#F5F5FA] transition-colors duration-300">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-[#F5F5FA] transition-colors duration-300">
              Cookies
            </Link>
            <Link href="/opt-out" className="hover:text-[#F5F5FA] transition-colors duration-300">
              Opt-out
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
