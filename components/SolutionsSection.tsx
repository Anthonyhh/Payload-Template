'use client'

import { motion } from 'framer-motion'
import { useInView } from '@/hooks/useInView'
import Image from 'next/image'

const technologies = [
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Framework' },
  { name: 'TypeScript', category: 'Language' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Python', category: 'AI/ML' },
  { name: 'TensorFlow', category: 'AI/ML' },
  { name: 'OpenAI', category: 'AI' },
  { name: 'Supabase', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'n8n', category: 'Automation' },
  { name: 'Zapier', category: 'Automation' },
  { name: 'Make', category: 'Automation' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'Google Cloud', category: 'Cloud' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
]

export function SolutionsSection() {
  const { ref, isInView } = useInView()

  return (
    <section
      id="solutions"
      className="section-padding bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
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
            Technology <span className="text-gradient">Stack</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We leverage cutting-edge technologies to build robust, scalable automation solutions
          </p>
        </motion.div>

        {/* Technology Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 group-hover:border-primary/50">
                <div className="flex flex-col items-center text-center space-y-2">
                  {/* Placeholder for logo */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-2xl font-bold text-gradient">
                    {tech.name.substring(0, 2)}
                  </div>
                  <h3 className="font-semibold text-sm">{tech.name}</h3>
                  <span className="text-xs text-muted-foreground">{tech.category}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              title: 'Enterprise Ready',
              description:
                'Scalable solutions built with enterprise-grade security and reliability',
              icon: '🏢',
            },
            {
              title: 'AI-Powered',
              description: 'Leverage the latest AI models for intelligent automation',
              icon: '🤖',
            },
            {
              title: 'Cloud Native',
              description:
                'Deploy anywhere with cloud-native architecture and DevOps best practices',
              icon: '☁️',
            },
          ].map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
