'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star } from 'lucide-react'
import { useInView } from '@/hooks/useInView'
import type { LeadFormData } from '@/lib/validations'

const plans = [
  {
    title: 'AI Partner',
    subtitle: 'Strategic AI Consultation',
    price: 'Custom',
    period: '/month',
    description: 'Perfect for businesses starting their AI journey',
    features: [
      'Monthly strategy sessions',
      'AI roadmap development',
      'Tool selection guidance',
      'Implementation oversight',
      'Team training workshops',
      'Priority email support',
    ],
    highlighted: false,
    service: 'fractional-caio' as const,
  },
  {
    title: 'Fractional CAIO & CTO',
    subtitle: 'Executive Leadership',
    price: 'From £15,000',
    period: '/month',
    description: 'Complete AI and technology leadership for your organization',
    features: [
      'Full CAIO & CTO services',
      'Weekly executive meetings',
      'Team building & management',
      'Technology stack decisions',
      'Vendor management',
      'Board presentations',
      'Direct team leadership',
      '24/7 priority support',
    ],
    highlighted: true,
    service: 'fractional-cto' as const,
  },
]

interface FractionalSectionProps {
  onOpenModal: (service?: LeadFormData['service']) => void
}

export function FractionalSection({ onOpenModal }: FractionalSectionProps) {
  const { ref, isInView } = useInView()

  return (
    <section id="fractional" className="section-padding">
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
            Fractional <span className="text-gradient">Leadership</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get executive-level AI and technology leadership without the full-time commitment
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card
                className={`relative h-full ${
                  plan.highlighted ? 'border-primary shadow-xl scale-105' : 'hover:shadow-lg'
                } transition-all duration-300`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.title}</CardTitle>
                  <CardDescription className="text-base mb-4">{plan.subtitle}</CardDescription>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    variant={plan.highlighted ? 'gradient' : 'outline'}
                    className="w-full"
                    size="lg"
                    onClick={() => onOpenModal(plan.service)}
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            All plans include initial consultation and customization based on your needs
          </p>
          <Button variant="link" onClick={() => onOpenModal()}>
            Schedule a consultation to discuss your requirements →
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
