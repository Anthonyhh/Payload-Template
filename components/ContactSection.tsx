'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Phone, MapPin, Clock, MessageSquare, Calendar } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

interface ContactSectionProps {
  onOpenModal: () => void
}

export function ContactSection({ onOpenModal }: ContactSectionProps) {
  const { ref, isInView } = useInView()

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'hello@flowstate-it.com',
      link: 'mailto:hello@flowstate-it.com',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+44 20 1234 5678',
      link: 'tel:+442012345678',
    },
    {
      icon: MapPin,
      title: 'Location',
      content: 'London, United Kingdom',
      link: null,
    },
    {
      icon: Clock,
      title: 'Business Hours',
      content: 'Mon-Fri, 9AM-6PM GMT',
      link: null,
    },
  ]

  return (
    <section
      id="contact"
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
            Get in <span className="text-gradient">Touch</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to transform your business with AI automation? Let's discuss how we can help
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
            <div className="space-y-4">
              {contactInfo.map((info, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.title}</p>
                        {info.link ? (
                          <a
                            href={info.link}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p className="font-medium">{info.content}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-0">
              <CardContent className="p-8 flex flex-col justify-center h-full">
                <h3 className="text-2xl font-semibold mb-4">Start Your AI Journey Today</h3>
                <p className="text-muted-foreground mb-6">
                  Schedule a free consultation to discover how AI automation can transform your
                  business operations and drive growth.
                </p>
                <div className="space-y-4">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full group"
                    onClick={onOpenModal}
                  >
                    <Calendar className="mr-2 w-4 h-4" />
                    Book Free Consultation
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={onOpenModal}>
                    <MessageSquare className="mr-2 w-4 h-4" />
                    Send a Message
                  </Button>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-center text-muted-foreground">
                    🚀 Average response time: Under 2 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap justify-center gap-8">
            {[
              '🔒 Enterprise Security',
              '✅ GDPR Compliant',
              '🏆 ISO Certified',
              '🤝 NDA Available',
            ].map((badge, index) => (
              <span key={index} className="text-sm font-medium">
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
