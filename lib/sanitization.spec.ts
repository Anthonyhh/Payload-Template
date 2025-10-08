import { describe, test, expect, beforeEach } from 'vitest'
import { DataSanitizer, dataSanitizer, leadFormSanitizationSchema } from './sanitization'

describe('DataSanitizer', () => {
  let sanitizer: DataSanitizer

  beforeEach(() => {
    sanitizer = new DataSanitizer({
      maxStringLength: 100,
      preventXssAttacks: true,
      validateEmailFormat: true,
    })
  })

  describe('sanitizeString', () => {
    test('trims whitespace from strings', () => {
      const result = sanitizer.sanitizeString('  hello world  ')
      expect(result).toBe('hello world')
    })

    test('throws error for non-string input', () => {
      expect(() => sanitizer.sanitizeString(123)).toThrow('Expected string')
      expect(() => sanitizer.sanitizeString(null)).toThrow('Expected string')
      expect(() => sanitizer.sanitizeString(undefined)).toThrow('Expected string')
    })

    test('truncates strings exceeding max length', () => {
      const longString = 'a'.repeat(200)
      const result = sanitizer.sanitizeString(longString)
      expect(result.length).toBe(100)
      expect(result).toBe('a'.repeat(100))
    })

    test('removes HTML tags by default', () => {
      const input = '<script>alert("xss")</script>Hello <b>World</b>!'
      const result = sanitizer.sanitizeString(input)
      expect(result).toBe('Hello World!')
    })

    test('removes XSS patterns', () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<iframe src="evil.com"></iframe>',
        '<img onerror="alert(1)" src="x">',
        'data:text/html,<script>alert(1)</script>',
      ]

      for (const input of xssInputs) {
        const result = sanitizer.sanitizeString(input, 'test')
        expect(result).not.toContain('script')
        expect(result).not.toContain('javascript:')
        expect(result).not.toContain('onerror')
        expect(result).not.toContain('data:text/html')
      }
    })
  })

  describe('sanitizeEmail', () => {
    test('converts email to lowercase', () => {
      const result = sanitizer.sanitizeEmail('USER@EXAMPLE.COM')
      expect(result).toBe('user@example.com')
    })

    test('validates email format', () => {
      expect(() => sanitizer.sanitizeEmail('invalid-email')).toThrow('Invalid email format')
      expect(() => sanitizer.sanitizeEmail('user@')).toThrow('Invalid email format')
      expect(() => sanitizer.sanitizeEmail('@domain.com')).toThrow('Invalid email format')
    })

    test('accepts valid email formats', () => {
      const validEmails = ['user@example.com', 'test.user+tag@domain.co.uk', 'simple@test.org']

      for (const email of validEmails) {
        const result = sanitizer.sanitizeEmail(email)
        expect(result).toBe(email.toLowerCase())
      }
    })

    test('detects email injection attempts', () => {
      const maliciousEmails = [
        'user@example.com\nBCC: evil@hacker.com',
        'user@example.com\rCC: evil@hacker.com',
        'user@example.com%0aSubject: Spam',
        'user@example.com\nContent-Type: text/html',
      ]

      for (const email of maliciousEmails) {
        expect(() => sanitizer.sanitizeEmail(email)).toThrow('Invalid email format')
      }
    })
  })

  describe('sanitizeUrl', () => {
    test('validates URL format', () => {
      expect(() => sanitizer.sanitizeUrl('not-a-url')).toThrow('Invalid URL format')
      expect(() => sanitizer.sanitizeUrl('http://')).toThrow('Invalid URL format')
    })

    test('allows valid protocols', () => {
      const validUrls = [
        'https://example.com',
        'http://test.org',
        'https://subdomain.example.com/path?query=value',
      ]

      for (const url of validUrls) {
        const result = sanitizer.sanitizeUrl(url)
        expect(result).toBe(url)
      }
    })

    test('blocks disallowed protocols', () => {
      const config = new DataSanitizer({ allowedUrlProtocols: ['https'] })

      expect(() => config.sanitizeUrl('http://example.com')).toThrow('Protocol http: not allowed')
      expect(() => config.sanitizeUrl('ftp://example.com')).toThrow('Protocol ftp: not allowed')
      expect(() => config.sanitizeUrl('javascript:alert(1)')).toThrow(
        'Protocol javascript: not allowed'
      )
    })
  })

  describe('sanitizeObject', () => {
    test('sanitizes object according to schema', () => {
      const input = {
        name: '  John Doe  ',
        email: 'JOHN@EXAMPLE.COM',
        website: 'https://example.com',
        age: 25,
        active: true,
        optional: null,
        company: '<script>alert("xss")</script>ACME Corp',
      }

      const schema = {
        name: 'string' as const,
        email: 'email' as const,
        website: 'url' as const,
        age: 'number' as const,
        active: 'boolean' as const,
        optional: 'optional_string' as const,
        company: 'string' as const,
      }

      const result = sanitizer.sanitizeObject(input, schema)

      expect(result.name).toBe('John Doe')
      expect(result.email).toBe('john@example.com')
      expect(result.website).toBe('https://example.com')
      expect(result.age).toBe(25)
      expect(result.active).toBe(true)
      expect(result.optional).toBeUndefined() // Empty optional field should be skipped
      expect(result.company).toBe('ACME Corp') // XSS removed
    })

    test('skips optional fields that are null or undefined', () => {
      const input = {
        required: 'value',
        optional1: null,
        optional2: undefined,
      }

      const schema = {
        required: 'string' as const,
        optional1: 'optional_string' as const,
        optional2: 'optional_string' as const,
      }

      const result = sanitizer.sanitizeObject(input, schema)

      expect(result.required).toBe('value')
      expect('optional1' in result).toBe(false)
      expect('optional2' in result).toBe(false)
    })

    test('throws error for empty strings in optional fields', () => {
      const input = {
        required: 'value',
        optional1: '',
      }

      const schema = {
        required: 'string' as const,
        optional1: 'optional_string' as const,
      }

      expect(() => sanitizer.sanitizeObject(input, schema)).toThrow(
        'Field optional1: Empty string not allowed'
      )
    })

    test('throws error for invalid data types', () => {
      const input = {
        name: 123, // Should be string
        active: 'yes', // Should be boolean
      }

      const schema = {
        name: 'string' as const,
        active: 'boolean' as const,
      }

      expect(() => sanitizer.sanitizeObject(input, schema)).toThrow()
    })
  })

  describe('leadFormSanitizationSchema', () => {
    test('schema covers all expected lead form fields', () => {
      const expectedFields = [
        'name',
        'email',
        'company',
        'role',
        'website',
        'service',
        'team_size',
        'budget',
        'bottleneck',
        'consent',
      ]

      for (const field of expectedFields) {
        expect(leadFormSanitizationSchema).toHaveProperty(field)
      }
    })

    test('required fields are not optional in schema', () => {
      const requiredFields = ['name', 'email', 'service', 'consent']

      for (const field of requiredFields) {
        const schemaType =
          leadFormSanitizationSchema[field as keyof typeof leadFormSanitizationSchema]
        expect(schemaType).not.toContain('optional')
      }
    })

    test('optional fields are marked as optional in schema', () => {
      const optionalFields = ['company', 'role', 'website', 'team_size', 'budget', 'bottleneck']

      for (const field of optionalFields) {
        const schemaType =
          leadFormSanitizationSchema[field as keyof typeof leadFormSanitizationSchema]
        expect(schemaType).toContain('optional')
      }
    })
  })
})
