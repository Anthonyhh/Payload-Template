import { describe, expect, test } from 'vitest'
import { leadFormSchema, contactFormSchema } from './validations'

const MIN_NAME_LENGTH = 2
const MAX_BOTTLENECK_LENGTH = 500
const MIN_MESSAGE_LENGTH = 10

describe('leadFormSchema', () => {
  const validLead = {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Test Company',
    role: 'CEO',
    website: 'https://example.com',
    service: 'agentic-ai',
    team_size: '1-10',
    budget: '10k-50k',
    bottleneck: 'Too many manual processes',
    consent: true,
  }

  test('validates correct lead data', () => {
    const result = leadFormSchema.parse(validLead)
    expect(result).toEqual(validLead)
  })

  test('requires name field', () => {
    const invalidLead = { ...validLead, name: '' }
    expect(() => leadFormSchema.parse(invalidLead)).toThrow('Name must be at least 2 characters')
  })

  test('requires valid email format', () => {
    const invalidLead = { ...validLead, email: 'invalid-email' }
    expect(() => leadFormSchema.parse(invalidLead)).toThrow('Invalid email address')
  })

  test('validates service enum values', () => {
    const validServices = [
      'agentic-ai',
      'workflow-automation',
      'lead-gen',
      'sop-automation',
      'fractional-caio',
      'fractional-cto',
      'other',
    ]

    validServices.forEach((service) => {
      const leadWithService = { ...validLead, service }
      expect(() => leadFormSchema.parse(leadWithService)).not.toThrow()
    })
  })

  test('rejects invalid service values', () => {
    const invalidLead = { ...validLead, service: 'invalid-service' }
    expect(() => leadFormSchema.parse(invalidLead)).toThrow()
  })

  test('requires consent to be true', () => {
    const invalidLead = { ...validLead, consent: false }
    expect(() => leadFormSchema.parse(invalidLead)).toThrow(
      'You must agree to the terms and conditions'
    )
  })

  test('handles optional website field', () => {
    const { website, ...leadWithoutWebsite } = validLead
    expect(() => leadFormSchema.parse(leadWithoutWebsite)).not.toThrow()

    const leadWithEmptyWebsite = { ...validLead, website: '' }
    expect(() => leadFormSchema.parse(leadWithEmptyWebsite)).not.toThrow()
  })

  test('validates website URL format when provided', () => {
    const invalidLead = { ...validLead, website: 'not-a-url' }
    expect(() => leadFormSchema.parse(invalidLead)).toThrow('Invalid URL')
  })

  test('validates team size enum values', () => {
    const validSizes = ['1-10', '11-50', '51-200', '201-500', '500+']

    validSizes.forEach((team_size) => {
      const leadWithSize = { ...validLead, team_size }
      expect(() => leadFormSchema.parse(leadWithSize)).not.toThrow()
    })
  })

  test('validates budget enum values', () => {
    const validBudgets = ['<10k', '10k-50k', '50k-100k', '100k-500k', '500k+']

    validBudgets.forEach((budget) => {
      const leadWithBudget = { ...validLead, budget }
      expect(() => leadFormSchema.parse(leadWithBudget)).not.toThrow()
    })
  })

  test('limits bottleneck field length', () => {
    const longBottleneck = 'a'.repeat(MAX_BOTTLENECK_LENGTH + 1)
    const invalidLead = { ...validLead, bottleneck: longBottleneck }
    expect(() => leadFormSchema.parse(invalidLead)).toThrow(
      `Please keep your response under ${MAX_BOTTLENECK_LENGTH} characters`
    )
  })

  test('handles minimum required fields only', () => {
    const minimalLead = {
      name: 'John Doe',
      email: 'john@example.com',
      service: 'agentic-ai',
      consent: true,
    }
    expect(() => leadFormSchema.parse(minimalLead)).not.toThrow()
  })
})

describe('contactFormSchema', () => {
  const validContact = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    message: 'This is a test message with enough characters',
  }

  test('validates correct contact data', () => {
    const result = contactFormSchema.parse(validContact)
    expect(result).toEqual(validContact)
  })

  test('requires name field', () => {
    const shortName = 'A'.repeat(MIN_NAME_LENGTH - 1)
    const invalidContact = { ...validContact, name: shortName }
    expect(() => contactFormSchema.parse(invalidContact)).toThrow(
      `Name must be at least ${MIN_NAME_LENGTH} characters`
    )
  })

  test('requires valid email format', () => {
    const invalidContact = { ...validContact, email: 'invalid-email' }
    expect(() => contactFormSchema.parse(invalidContact)).toThrow('Invalid email address')
  })

  test('requires message with minimum length', () => {
    const shortMessage = 'M'.repeat(MIN_MESSAGE_LENGTH - 1)
    const invalidContact = { ...validContact, message: shortMessage }
    expect(() => contactFormSchema.parse(invalidContact)).toThrow(
      `Message must be at least ${MIN_MESSAGE_LENGTH} characters`
    )
  })
})
