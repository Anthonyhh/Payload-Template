'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Mic, Workflow, Users, ArrowRight } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

const services = [
  {
    icon: Bot,
    title: 'Agentic AI & Voice Automation',
    description:
      'Deploy intelligent AI agents that can handle complex tasks autonomously. Integrate voice AI for customer service, sales calls, and internal communications.',
    features: ['24/7 AI Customer Support', 'Voice-to-Action Workflows', 'Multi-Language Support'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description:
      'Streamline your business processes with custom automation solutions. Connect your tools, eliminate manual tasks, and boost productivity.',
    features: ['Process Mapping', 'Tool Integration', 'Real-time Analytics'],
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Users,
    title: 'Lead-Gen Automation',
    description:
      'Automate your lead generation and nurturing processes. Score, enrich, and route leads automatically to maximize conversion rates.',
    features: ['Lead Scoring', 'Data Enrichment', 'Automated Outreach'],
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Workflow,
    title: 'SOP Automation',
    description:
      'Transform your standard operating procedures into automated workflows. Ensure consistency, compliance, and efficiency across your organization.',
    features: ['Document Processing', 'Compliance Tracking', 'Audit Trails'],
    gradient: 'from-green-500 to-teal-500',
  },
]

interface ServicesSectionProps {
  onOpenModal: () => void
}

export function ServicesSection({ onOpenModal }: ServicesSectionProps) {
  const { ref, isInView } = useInView()

  return (
    <section
      id="services"
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
            Our <span className="text-gradient">Services</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI automation solutions tailored to transform your business operations
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="card-base group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden relative">
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />

                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${service.gradient} text-white`}
                    >
                      <service.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                      <CardDescription className="text-base">{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div
                          className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.gradient}`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant="ghost" className="group/btn w-full" onClick={onOpenModal}>
                    Learn More
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button variant="gradient" size="xl" onClick={onOpenModal}>
            Get Started with AI Automation
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
