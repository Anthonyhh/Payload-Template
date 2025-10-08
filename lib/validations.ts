import { z } from 'zod'

export const leadFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  company: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  role: z.string().min(2, 'Role must be at least 2 characters').optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  service: z.enum([
    'agentic-ai',
    'workflow-automation',
    'lead-gen',
    'sop-automation',
    'fractional-caio',
    'fractional-cto',
    'other',
  ]),
  team_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  budget: z.enum(['<10k', '10k-50k', '50k-100k', '100k-500k', '500k+']).optional(),
  bottleneck: z.string().max(500, 'Please keep your response under 500 characters').optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
})

export type LeadFormData = z.infer<typeof leadFormSchema>

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
