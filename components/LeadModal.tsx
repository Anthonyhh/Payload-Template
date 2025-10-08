'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { leadFormSchema, type LeadFormData } from '@/lib/validations'
import { submitLead } from '@/lib/supabase'
import { CheckCircle, Loader2 } from 'lucide-react'

interface LeadModalProps {
  isOpen: boolean
  onClose: () => void
  presetService?: LeadFormData['service']
}

export function LeadModal({ isOpen, onClose, presetService }: LeadModalProps) {
  const [formData, setFormData] = useState<Partial<LeadFormData>>({
    service: presetService || 'agentic-ai',
    consent: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // Validate form data
      const validatedData = leadFormSchema.parse(formData)

      setIsSubmitting(true)

      // Submit to Supabase
      const { data, error } = await submitLead(validatedData)

      if (error) {
        throw error
      }

      // Show success state
      setIsSuccess(true)

      // Reset form after delay and close
      setTimeout(() => {
        setFormData({ service: 'agentic-ai', consent: false })
        setIsSuccess(false)
        onClose()
      }, 3000)
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        // General error
        setErrors({ general: 'Something went wrong. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof LeadFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader>
                <DialogTitle>Book Your Free AI Consultation</DialogTitle>
                <DialogDescription>
                  Fill out the form below and we'll get back to you within 2 hours
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="John Doe"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Company */}
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Acme Inc."
                    className={errors.company ? 'border-red-500' : ''}
                  />
                  {errors.company && <p className="text-sm text-red-500 mt-1">{errors.company}</p>}
                </div>

                {/* Role */}
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role || ''}
                    onChange={(e) => handleChange('role', e.target.value)}
                    placeholder="CEO, CTO, etc."
                    className={errors.role ? 'border-red-500' : ''}
                  />
                  {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className={errors.website ? 'border-red-500' : ''}
                  />
                  {errors.website && <p className="text-sm text-red-500 mt-1">{errors.website}</p>}
                </div>

                {/* Service */}
                <div>
                  <Label htmlFor="service">Service Interested In *</Label>
                  <Select
                    value={formData.service}
                    onValueChange={(value) => handleChange('service', value)}
                  >
                    <SelectTrigger className={errors.service ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agentic-ai">Agentic AI & Voice Automation</SelectItem>
                      <SelectItem value="workflow-automation">Workflow Automation</SelectItem>
                      <SelectItem value="lead-gen">Lead Generation Automation</SelectItem>
                      <SelectItem value="sop-automation">SOP Automation</SelectItem>
                      <SelectItem value="fractional-caio">Fractional CAIO</SelectItem>
                      <SelectItem value="fractional-cto">Fractional CTO</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.service && <p className="text-sm text-red-500 mt-1">{errors.service}</p>}
                </div>

                {/* Team Size */}
                <div>
                  <Label htmlFor="team_size">Team Size</Label>
                  <Select
                    value={formData.team_size}
                    onValueChange={(value) => handleChange('team_size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="500+">500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget */}
                <div>
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(value) => handleChange('budget', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<10k">Less than £10k</SelectItem>
                      <SelectItem value="10k-50k">£10k - £50k</SelectItem>
                      <SelectItem value="50k-100k">£50k - £100k</SelectItem>
                      <SelectItem value="100k-500k">£100k - £500k</SelectItem>
                      <SelectItem value="500k+">£500k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bottleneck */}
                <div>
                  <Label htmlFor="bottleneck">What's your biggest operational bottleneck?</Label>
                  <Textarea
                    id="bottleneck"
                    value={formData.bottleneck || ''}
                    onChange={(e) => handleChange('bottleneck', e.target.value)}
                    placeholder="Describe your main challenge..."
                    rows={3}
                    className={errors.bottleneck ? 'border-red-500' : ''}
                  />
                  {errors.bottleneck && (
                    <p className="text-sm text-red-500 mt-1">{errors.bottleneck}</p>
                  )}
                </div>

                {/* Consent */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={formData.consent}
                    onCheckedChange={(checked: boolean) => handleChange('consent', checked)}
                    className={errors.consent ? 'border-red-500' : ''}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="consent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the terms and conditions *
                    </label>
                    <p className="text-sm text-muted-foreground">
                      You agree to our Terms of Service and Privacy Policy.
                    </p>
                    {errors.consent && <p className="text-sm text-red-500">{errors.consent}</p>}
                  </div>
                </div>

                {/* Error message */}
                {errors.general && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    {errors.general}
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Book Consultation'
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
              <p className="text-muted-foreground">
                We've received your request and will contact you within 2 hours.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
