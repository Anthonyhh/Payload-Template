'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useInView } from '@/hooks/useInView'
import Script from 'next/script'

const faqs = [
  {
    question: 'What is Agentic AI and how can it help my business?',
    answer:
      'Agentic AI refers to autonomous AI systems that can perform complex tasks, make decisions, and interact naturally with humans. For your business, this means AI agents that can handle customer service, process documents, manage workflows, and make intelligent decisions 24/7, significantly reducing costs and improving efficiency.',
  },
  {
    question: 'How long does it take to implement an automation solution?',
    answer:
      'Implementation timelines vary based on complexity, but typically: Simple automations (1-2 weeks), Medium complexity workflows (3-6 weeks), Enterprise-wide solutions (2-3 months). We follow an agile approach with incremental deployments to deliver value quickly.',
  },
  {
    question: 'Do I need technical expertise to use your automation solutions?',
    answer:
      'No technical expertise is required. We design all our solutions to be user-friendly and provide comprehensive training for your team. Our automations work seamlessly with your existing tools and processes, and we offer ongoing support to ensure smooth operations.',
  },
  {
    question: 'What ROI can I expect from AI automation?',
    answer:
      'Most clients see ROI within 3-6 months. Typical benefits include: 60-80% reduction in manual task time, 90% faster processing speeds, 50% reduction in operational costs, and 99%+ accuracy in data processing. We provide detailed ROI calculations during consultation.',
  },
  {
    question: 'How secure is my data with AI automation?',
    answer:
      'Security is our top priority. We implement enterprise-grade encryption, comply with GDPR and data protection regulations, use secure cloud infrastructure, conduct regular security audits, and ensure all AI models are trained on anonymized data. Your data never leaves your control.',
  },
  {
    question: 'Can AI automation integrate with my existing software?',
    answer:
      'Yes! We specialize in integration with popular tools like Salesforce, HubSpot, Microsoft 365, Google Workspace, SAP, and custom APIs. Our solutions are designed to enhance your existing tech stack, not replace it.',
  },
  {
    question: 'What is a Fractional CAIO/CTO and do I need one?',
    answer:
      'A Fractional CAIO (Chief AI Officer) or CTO provides executive-level technology leadership on a part-time basis. This is ideal if you need strategic AI guidance, technology roadmap development, or team leadership without the cost of a full-time executive. Perfect for companies in growth or transformation phases.',
  },
  {
    question: 'What support do you provide after implementation?',
    answer:
      'We offer comprehensive post-implementation support including: 24/7 monitoring and maintenance, regular performance optimization, team training and upskilling, monthly strategy reviews, and immediate issue resolution. Support levels can be customized to your needs.',
  },
]

export function FAQSection() {
  const { ref, isInView } = useInView()

  // Generate FAQ schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <section id="faq" className="section-padding">
      {/* FAQ Schema for SEO */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          ref={ref as any}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about AI automation and our services
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">Still have questions? We're here to help!</p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              const element = document.querySelector('#contact')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            Contact Us
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
