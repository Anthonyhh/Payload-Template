'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

// These shadcn components ship as .jsx without type declarations;
// cast to any to avoid TS2559 when used from .tsx files.
const TypedNavigationMenu = NavigationMenu as any
const TypedNavigationMenuList = NavigationMenuList as any
const TypedNavigationMenuItem = NavigationMenuItem as any
const TypedNavigationMenuTrigger = NavigationMenuTrigger as any
const TypedNavigationMenuContent = NavigationMenuContent as any
const TypedSheet = Sheet as any
const TypedSheetTrigger = SheetTrigger as any
const TypedSheetContent = SheetContent as any
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

const services = [
  { label: 'AI Strategy', href: '/services/ai-strategy' },
  { label: 'AI Workflow Automation', href: '/services/ai-workflow-automation' },
  { label: 'Agentic AI Systems', href: '/services/agentic-ai' },
  { label: 'Prompt Engineering', href: '/services/prompt-engineering' },
  { label: 'Data & ML', href: '/services/data-ml' },
  { label: 'Fractional CAIO', href: '/services/fractional-caio' },
]

const solutionsByIndustry = [
  { label: 'Manufacturing', href: '/solutions/manufacturing' },
  { label: 'Financial Services', href: '/solutions/financial-services' },
  { label: 'Healthcare', href: '/solutions/healthcare' },
  { label: 'Legal & Solicitors', href: '/solutions/legal-solicitors' },
  { label: 'Accountancy', href: '/solutions/accountancy' },
  { label: 'Retail', href: '/solutions/retail' },
  { label: 'Construction', href: '/solutions/construction' },
]

const solutionsByUseCase = [
  { label: 'Customer Service Automation', href: '/solutions/customer-service-automation' },
  { label: 'Document Processing', href: '/solutions/document-processing' },
  { label: 'Sales & Lead Generation', href: '/solutions/sales-lead-generation' },
]

const directLinks = [
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
]

export function Nav() {
  const [scrolled, setScrolled] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
      style={
        scrolled
          ? {
              background: 'rgba(20, 20, 28, 0.90)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid #2A2A38',
            }
          : {
              background: 'transparent',
              backdropFilter: 'none',
              borderBottom: 'none',
            }
      }
    >
      <div className="container mx-auto px-8 h-16 flex items-center justify-between max-w-screen-2xl">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading font-bold text-[#F5F5FA] text-lg hover:text-white transition-colors duration-300"
        >
          FlowState IT
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <TypedNavigationMenu>
            <TypedNavigationMenuList>
              {/* Services dropdown */}
              <TypedNavigationMenuItem>
                <TypedNavigationMenuTrigger
                  className="text-sm text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300 bg-transparent hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-[#F5F5FA] h-auto px-0 py-0"
                >
                  Services
                </TypedNavigationMenuTrigger>
                <TypedNavigationMenuContent>
                  <ul className="w-56 p-2 bg-[#1C1C26] border border-[#2A2A38] rounded-xl shadow-xl">
                    {services.map((service) => (
                      <li key={service.href}>
                        <Link
                          href={service.href}
                          className={cn(
                            'block px-3 py-2 text-sm rounded-lg transition-colors duration-200',
                            isActive(service.href)
                              ? 'text-[#F5F5FA] bg-[#22222E]'
                              : 'text-[#A0A0B0] hover:text-[#F5F5FA] hover:bg-[#22222E]'
                          )}
                        >
                          {service.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </TypedNavigationMenuContent>
              </TypedNavigationMenuItem>

              {/* Solutions dropdown */}
              <TypedNavigationMenuItem>
                <TypedNavigationMenuTrigger
                  className="text-sm text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300 bg-transparent hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-[#F5F5FA] h-auto px-0 py-0"
                >
                  Solutions
                </TypedNavigationMenuTrigger>
                <TypedNavigationMenuContent>
                  <div className="w-72 p-4 bg-[#1C1C26] border border-[#2A2A38] rounded-xl shadow-xl">
                    <p className="text-xs font-semibold text-[#F5F5FA] uppercase tracking-widest mb-2">
                      By Industry
                    </p>
                    <ul className="mb-4">
                      {solutionsByIndustry.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              'block px-2 py-1.5 text-sm rounded-lg transition-colors duration-200',
                              isActive(item.href)
                                ? 'text-[#F5F5FA] bg-[#22222E]'
                                : 'text-[#A0A0B0] hover:text-[#F5F5FA] hover:bg-[#22222E]'
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs font-semibold text-[#F5F5FA] uppercase tracking-widest mb-2">
                      By Use Case
                    </p>
                    <ul>
                      {solutionsByUseCase.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              'block px-2 py-1.5 text-sm rounded-lg transition-colors duration-200',
                              isActive(item.href)
                                ? 'text-[#F5F5FA] bg-[#22222E]'
                                : 'text-[#A0A0B0] hover:text-[#F5F5FA] hover:bg-[#22222E]'
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TypedNavigationMenuContent>
              </TypedNavigationMenuItem>
            </TypedNavigationMenuList>
          </TypedNavigationMenu>

          {/* Direct links */}
          {directLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition-colors duration-300',
                isActive(link.href)
                  ? 'text-[#F5F5FA] border-b-2 border-[#E91E8C] pb-0.5'
                  : 'text-[#A0A0B0] hover:text-[#F5F5FA]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: CTA + mobile hamburger */}
        <div className="flex items-center gap-4">
          <Button asChild variant="gradient" size="default" className="hidden md:flex">
            <Link href="/ai-readiness-audit">Get AI Audit</Link>
          </Button>

          {/* Mobile hamburger */}
          <TypedSheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <TypedSheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-[#F5F5FA]"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </TypedSheetTrigger>
            <TypedSheetContent
              side="right"
              className="w-80 bg-[#1C1C26] border-l border-[#2A2A38] flex flex-col p-0"
            >
              {/* Mobile nav header */}
              <div className="px-6 py-5 border-b border-[#2A2A38]">
                <Link
                  href="/"
                  className="font-heading font-bold text-[#F5F5FA] text-lg"
                  onClick={() => setSheetOpen(false)}
                >
                  FlowState IT
                </Link>
              </div>

              {/* Mobile nav links */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <Accordion type="multiple" className="w-full">
                  {/* Services accordion */}
                  <AccordionItem value="services" className="border-b border-[#2A2A38]">
                    <AccordionTrigger className="text-sm text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300 py-3 hover:no-underline">
                      Services
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <ul className="space-y-1 pl-2">
                        {services.map((service) => (
                          <li key={service.href}>
                            <Link
                              href={service.href}
                              onClick={() => setSheetOpen(false)}
                              className={cn(
                                'block py-2 px-2 text-sm rounded-lg transition-colors duration-200',
                                isActive(service.href)
                                  ? 'text-[#F5F5FA] border-l-2 border-[#E91E8C] pl-2'
                                  : 'text-[#A0A0B0] hover:text-[#F5F5FA]'
                              )}
                            >
                              {service.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Solutions accordion */}
                  <AccordionItem value="solutions" className="border-b border-[#2A2A38]">
                    <AccordionTrigger className="text-sm text-[#A0A0B0] hover:text-[#F5F5FA] transition-colors duration-300 py-3 hover:no-underline">
                      Solutions
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <p className="text-xs font-semibold text-[#F5F5FA] uppercase tracking-widest mb-2 pl-2">
                        By Industry
                      </p>
                      <ul className="space-y-1 pl-2 mb-4">
                        {solutionsByIndustry.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setSheetOpen(false)}
                              className={cn(
                                'block py-2 px-2 text-sm rounded-lg transition-colors duration-200',
                                isActive(item.href)
                                  ? 'text-[#F5F5FA] border-l-2 border-[#E91E8C] pl-2'
                                  : 'text-[#A0A0B0] hover:text-[#F5F5FA]'
                              )}
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs font-semibold text-[#F5F5FA] uppercase tracking-widest mb-2 pl-2">
                        By Use Case
                      </p>
                      <ul className="space-y-1 pl-2">
                        {solutionsByUseCase.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setSheetOpen(false)}
                              className={cn(
                                'block py-2 px-2 text-sm rounded-lg transition-colors duration-200',
                                isActive(item.href)
                                  ? 'text-[#F5F5FA] border-l-2 border-[#E91E8C] pl-2'
                                  : 'text-[#A0A0B0] hover:text-[#F5F5FA]'
                              )}
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Direct links */}
                <div className="mt-2 space-y-1">
                  {directLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        'block py-3 px-2 text-sm transition-colors duration-300',
                        isActive(link.href)
                          ? 'text-[#F5F5FA] border-l-2 border-[#E91E8C] pl-2'
                          : 'text-[#A0A0B0] hover:text-[#F5F5FA]'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile CTA pinned at bottom */}
              <div className="px-6 py-5 border-t border-[#2A2A38]">
                <Button asChild variant="gradient" size="default" className="w-full">
                  <Link href="/ai-readiness-audit" onClick={() => setSheetOpen(false)}>
                    Get AI Audit
                  </Link>
                </Button>
              </div>
            </TypedSheetContent>
          </TypedSheet>
        </div>
      </div>
    </header>
  )
}
