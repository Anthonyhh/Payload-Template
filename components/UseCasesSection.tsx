'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Heart, Building2, ShoppingCart, Truck, Briefcase, GraduationCap } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

const industries = [
  {
    icon: Heart,
    title: 'Healthcare',
    description: 'Transform patient care with AI-powered automation',
    useCases: [
      {
        title: 'Patient Appointment Scheduling',
        description:
          'Automate appointment booking, rescheduling, and reminders with AI voice agents.',
      },
      {
        title: 'Medical Records Processing',
        description: 'Extract and organize patient data from various sources automatically.',
      },
      {
        title: 'Insurance Verification',
        description: 'Streamline insurance eligibility checks and prior authorization processes.',
      },
    ],
  },
  {
    icon: Building2,
    title: 'Finance',
    description: 'Enhance financial operations with intelligent automation',
    useCases: [
      {
        title: 'KYC & Compliance',
        description:
          'Automate customer verification and compliance checks with AI-powered workflows.',
      },
      {
        title: 'Fraud Detection',
        description:
          'Real-time transaction monitoring and anomaly detection using machine learning.',
      },
      {
        title: 'Customer Support',
        description:
          'AI agents handling account inquiries, transaction disputes, and general support.',
      },
    ],
  },
  {
    icon: ShoppingCart,
    title: 'Retail',
    description: 'Revolutionize retail operations and customer experience',
    useCases: [
      {
        title: 'Inventory Management',
        description:
          'Predictive stock management and automated reordering based on demand patterns.',
      },
      {
        title: 'Personalized Marketing',
        description: 'AI-driven customer segmentation and personalized campaign automation.',
      },
      {
        title: 'Customer Service Bots',
        description:
          '24/7 multilingual support for order tracking, returns, and product inquiries.',
      },
    ],
  },
  {
    icon: Truck,
    title: 'Logistics',
    description: 'Optimize supply chain and delivery operations',
    useCases: [
      {
        title: 'Route Optimization',
        description: 'AI-powered route planning for maximum efficiency and cost reduction.',
      },
      {
        title: 'Shipment Tracking',
        description: 'Automated updates and proactive issue resolution for shipment delays.',
      },
      {
        title: 'Warehouse Automation',
        description: 'Intelligent inventory placement and pick-pack optimization.',
      },
    ],
  },
]

export function UseCasesSection() {
  const { ref, isInView } = useInView()

  return (
    <section
      id="usecases"
      className="section-padding bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
    >
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
            Industry <span className="text-gradient">Use Cases</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover how AI automation transforms operations across different industries
          </p>
        </motion.div>

        {/* Industries Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {industries.map((industry, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                      <industry.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{industry.title}</h3>
                      <p className="text-sm text-muted-foreground">{industry.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {industry.useCases.map((useCase, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700"
                      >
                        <h4 className="font-semibold text-sm mb-2">{useCase.title}</h4>
                        <p className="text-sm text-muted-foreground">{useCase.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto"
        >
          {[
            { value: '85%', label: 'Cost Reduction' },
            { value: '3x', label: 'Faster Processing' },
            { value: '99.9%', label: 'Accuracy Rate' },
            { value: '24/7', label: 'Availability' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
