'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, Hammer, Rocket, TrendingUp } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

const processSteps = [
  {
    icon: Lightbulb,
    title: 'Design',
    description:
      'We analyze your business processes and design custom AI automation solutions tailored to your specific needs.',
    details: ['Process Mapping', 'Requirements Gathering', 'Solution Architecture'],
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Hammer,
    title: 'Build',
    description:
      'Our expert team develops and configures your automation workflows using cutting-edge AI technologies.',
    details: ['Custom Development', 'Integration Setup', 'Testing & QA'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Rocket,
    title: 'Deploy',
    description:
      'We seamlessly deploy your automation solutions with minimal disruption to your existing operations.',
    details: ['Staged Rollout', 'Team Training', 'Documentation'],
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: TrendingUp,
    title: 'Optimise',
    description:
      'Continuous monitoring and optimization ensure your automations deliver maximum value over time.',
    details: ['Performance Monitoring', 'A/B Testing', 'Iterative Improvements'],
    color: 'from-green-500 to-teal-500',
  },
]

export function ProcessSection() {
  const { ref, isInView } = useInView()

  return (
    <section id="process" className="section-padding">
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
            Our <span className="text-gradient">Process</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A proven methodology to transform your business with AI automation
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />

          {/* Process Steps */}
          <div className="space-y-12">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className={`flex items-center gap-8 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Card */}
                <Card className="flex-1 hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${step.color} text-white`}>
                        <step.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{step.description}</CardDescription>
                    <ul className="space-y-1">
                      {step.details.map((detail, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color}`}
                          />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Timeline node */}
                <div className="hidden md:flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.2 }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}
                  >
                    <span className="text-xl font-bold">{index + 1}</span>
                  </motion.div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
