'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Linkedin, Twitter, Github, Mail, Phone, MapPin, ArrowRight } from 'lucide-react'

interface FooterProps {
  onOpenModal: () => void
}

export function Footer({ onOpenModal }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    services: [
      { label: 'Agentic AI', href: '#services' },
      { label: 'Workflow Automation', href: '#services' },
      { label: 'Lead Generation', href: '#services' },
      { label: 'SOP Automation', href: '#services' },
    ],
    company: [
      { label: 'About Us', href: '#' },
      { label: 'Use Cases', href: '#usecases' },
      { label: 'Process', href: '#process' },
      { label: 'Blog', href: '/blog' },
    ],
    resources: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Case Studies', href: '#' },
      { label: 'FAQ', href: '#faq' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'GDPR', href: '#' },
    ],
  }

  const socialLinks = [
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
  ]

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* CTA Section */}
      <div className="border-b border-gray-800">
        <div className="container-custom py-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to Transform Your Business?
                </h3>
                <p className="text-white/90">
                  Join 50+ companies already automating with FlowState IT
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
                <Button size="lg" variant="secondary" onClick={onOpenModal} className="group">
                  Start Free Consultation
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white hover:text-gray-900"
                  onClick={() => {
                    const element = document.querySelector('#contact')
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <h3 className="text-2xl font-bold text-white">FlowState IT</h3>
            </Link>
            <p className="text-sm mb-6 text-gray-400">
              Transforming business operations with cutting-edge AI automation solutions. Your
              partner in digital transformation.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                <a
                  href="mailto:hello@flowstate-it.com"
                  className="hover:text-white transition-colors"
                >
                  hello@flowstate-it.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <a href="tel:+442012345678" className="hover:text-white transition-colors">
                  +44 20 1234 5678
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span>London, United Kingdom</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                    onClick={(e) => {
                      if (link.href.startsWith('#')) {
                        e.preventDefault()
                        const element = document.querySelector(link.href)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' })
                        }
                      }
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  {link.href === '/blog' ? (
                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                      onClick={(e) => {
                        if (link.href.startsWith('#')) {
                          e.preventDefault()
                          const element = document.querySelector(link.href)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                      }}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                    onClick={(e) => {
                      if (link.href.startsWith('#')) {
                        e.preventDefault()
                        const element = document.querySelector(link.href)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' })
                        }
                      }
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © {currentYear} FlowState IT. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
