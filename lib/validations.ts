import { z } from 'zod'

// Generic validation schemas for Payload CMS integration
// Add your Payload collection schemas here

export const emailSchema = z.string().email('Invalid email address')

export const urlSchema = z.string().url('Invalid URL').optional().or(z.literal(''))
