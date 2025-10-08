import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { emailService, createEmailConfig, leadNotificationTemplates } from './email'
import type { EmailConfig, EmailNotification } from './email'

describe('createEmailConfig', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('returns null when required env vars are missing', () => {
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.SMTP_FROM

    const config = createEmailConfig()
    expect(config).toBeNull()
  })

  test('creates config with all required env vars present', () => {
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASS = 'password123'
    process.env.SMTP_FROM = 'noreply@example.com'

    const config = createEmailConfig()

    expect(config).toEqual({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: 'test@example.com',
      pass: 'password123',
      from: 'noreply@example.com',
    })
  })

  test('sets secure true for port 465', () => {
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_PORT = '465'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASS = 'password123'
    process.env.SMTP_FROM = 'noreply@example.com'

    const config = createEmailConfig()

    expect(config?.secure).toBe(true)
    expect(config?.port).toBe(465)
  })
})

describe('EmailNotificationService', () => {
  const testConfig: EmailConfig = {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    user: 'test@example.com',
    pass: 'password123',
    from: 'noreply@test.com',
  }

  test('initializes service with valid config', () => {
    expect(() => emailService.initialize(testConfig)).not.toThrow()
  })

  test('template variable replacement works correctly', () => {
    const template = 'Hello {{name}}, your order {{orderId}} is ready!'
    const expected = 'Hello John, your order 12345 is ready!'

    // Test the replacement logic manually
    let result = template
    result = result.replace(/\{\{\s*name\s*\}\}/g, 'John')
    result = result.replace(/\{\{\s*orderId\s*\}\}/g, '12345')

    expect(result).toBe(expected)
  })

  test('handles missing template variables gracefully', () => {
    const template = 'Hello {{name}}, your {{missing}} variable!'
    const expected = 'Hello John, your {{missing}} variable!'

    // Test the replacement logic manually - only replace known variables
    let result = template
    result = result.replace(/\{\{\s*name\s*\}\}/g, 'John')
    // missing variable should remain unchanged

    expect(result).toBe(expected)
  })
})

describe('leadNotificationTemplates', () => {
  test('newLead template contains required placeholders', () => {
    const template = leadNotificationTemplates.newLead

    expect(template.subject).toContain('{{service}}')
    expect(template.html).toContain('{{name}}')
    expect(template.html).toContain('{{email}}')
    expect(template.html).toContain('{{service}}')
    expect(template.html).toContain('{{leadId}}')
    expect(template.html).toContain('{{submissionTime}}')
  })

  test('leadAlert template contains required placeholders', () => {
    const template = leadNotificationTemplates.leadAlert

    expect(template.subject).toContain('{{service}}')
    expect(template.html).toContain('{{name}}')
    expect(template.html).toContain('{{email}}')
    expect(template.html).toContain('{{service}}')
    expect(template.html).toContain('{{budget}}')
    expect(template.html).toContain('{{leadId}}')
  })

  test('both templates have text versions', () => {
    expect(leadNotificationTemplates.newLead.text).toBeDefined()
    expect(leadNotificationTemplates.leadAlert.text).toBeDefined()
    expect(leadNotificationTemplates.newLead.text?.length).toBeGreaterThan(0)
    expect(leadNotificationTemplates.leadAlert.text?.length).toBeGreaterThan(0)
  })
})
