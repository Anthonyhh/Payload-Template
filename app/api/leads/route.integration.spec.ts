import { describe, expect, test, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { LeadFormData } from '@/lib/validations'

// Test constants - must be defined before mock
const TEST_WEBHOOK_URL = 'https://test-webhook.example.com/leads'
const TEST_WEBHOOK_SECRET = 'test-secret-key'

const VALID_LEAD: LeadFormData = {
  name: 'Integration Test User',
  email: 'integration@test.com',
  company: 'Test Company Inc',
  role: 'QA Engineer',
  website: 'https://test.example.com',
  service: 'agentic-ai',
  team_size: '11-50',
  budget: '50k-100k',
  bottleneck: 'Need better testing infrastructure',
  consent: true,
}

const MINIMAL_LEAD: LeadFormData = {
  name: 'Minimal User',
  email: 'minimal@test.com',
  service: 'workflow-automation',
  consent: true,
}

// Mock Supabase for testing
let mockSupabaseData: any = null
let mockSupabaseError: any = null

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockSupabaseData,
              error: mockSupabaseError,
            })
          ),
        })),
      })),
    })),
  })),
}))

// Import POST after mocking
import { POST } from './route'

describe('POST /api/leads - Integration Tests', () => {
  // Mock environment variables
  beforeAll(() => {
    vi.stubEnv('NEXT_PUBLIC_N8N_WEBHOOK_URL', TEST_WEBHOOK_URL)
    vi.stubEnv('WEBHOOK_SECRET', TEST_WEBHOOK_SECRET)
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    // Reset Supabase mock for each test
    mockSupabaseError = null
    mockSupabaseData = {
      id: 'mock-id-123',
      created_at: new Date().toISOString(),
      ...VALID_LEAD,
    }
  })

  describe('Successful submissions', () => {
    test('accepts valid lead with all fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(VALID_LEAD),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error', null)

      // Verify data matches input (excluding generated fields)
      const { data } = result
      expect(data).toMatchObject({
        name: VALID_LEAD.name,
        email: VALID_LEAD.email,
        service: VALID_LEAD.service,
        consent: VALID_LEAD.consent,
      })
    })

    test('accepts minimal required fields', async () => {
      mockSupabaseData = {
        id: 'mock-id-456',
        created_at: new Date().toISOString(),
        ...MINIMAL_LEAD,
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(MINIMAL_LEAD),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.data).toMatchObject({
        name: MINIMAL_LEAD.name,
        email: MINIMAL_LEAD.email,
        service: MINIMAL_LEAD.service,
      })
    })

    test('accepts optional fields when properly filled', async () => {
      const leadWithOptionals = {
        ...MINIMAL_LEAD,
        company: 'Valid Company Name',
        website: 'https://valid-url.com',
        bottleneck: 'This is a valid bottleneck description',
      }

      mockSupabaseData = {
        id: 'mock-id-789',
        created_at: new Date().toISOString(),
        ...leadWithOptionals,
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadWithOptionals),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Validation errors', () => {
    test('rejects invalid email format', async () => {
      const invalidLead = {
        ...VALID_LEAD,
        email: 'not-an-email',
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidLead),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const result = await response.json()
      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Invalid request')
    })

    test('rejects missing required fields', async () => {
      const incompleteLead = {
        email: 'test@example.com',
        // Missing: name, service, consent
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incompleteLead),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('rejects invalid service enum value', async () => {
      const invalidLead = {
        ...VALID_LEAD,
        service: 'invalid-service',
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidLead),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('rejects consent: false', async () => {
      const noConsentLead = {
        ...VALID_LEAD,
        consent: false,
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noConsentLead),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('rejects bottleneck over 500 characters', async () => {
      const longBottleneckLead = {
        ...VALID_LEAD,
        bottleneck: 'x'.repeat(501),
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(longBottleneckLead),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('rejects invalid URL format', async () => {
      const invalidUrlLead = {
        ...VALID_LEAD,
        website: 'not-a-url',
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUrlLead),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('rejects empty string for required company field', async () => {
      const emptyCompanyLead = {
        ...VALID_LEAD,
        company: '', // Empty string should fail validation if provided
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emptyCompanyLead),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Edge cases', () => {
    test('handles malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'not valid json {',
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('handles empty body', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    test('handles null values for optional fields', async () => {
      const leadWithNulls = {
        ...MINIMAL_LEAD,
        company: null,
        role: null,
        website: null,
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadWithNulls),
      })

      const response = await POST(request)
      // Should either accept or reject consistently
      expect([200, 400]).toContain(response.status)
    })
  })

  describe('Database error handling', () => {
    test('returns 500 when database save fails', async () => {
      // Mock database error
      mockSupabaseError = { message: 'Database connection failed' }
      mockSupabaseData = null

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(VALID_LEAD),
      })

      const response = await POST(request)
      expect(response.status).toBe(500)

      const result = await response.json()
      expect(result).toHaveProperty('error')
      expect(result.error).toBe('Failed to save lead')
    })
  })

  describe('Webhook behavior', () => {
    test('continues successfully even if webhook fails', async () => {
      // Mock fetch to simulate webhook failure
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === TEST_WEBHOOK_URL) {
          return Promise.reject(new Error('Webhook connection failed'))
        }
        return originalFetch(url)
      })

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(VALID_LEAD),
      })

      const response = await POST(request)

      // Should still succeed despite webhook failure
      expect(response.status).toBe(200)

      // Restore original fetch
      global.fetch = originalFetch
    })

    test('sends webhook with HMAC signature when secret is configured', async () => {
      let capturedHeaders: any = null

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
        if (url === TEST_WEBHOOK_URL) {
          capturedHeaders = options.headers
          return Promise.resolve({ ok: true, status: 200 })
        }
        return originalFetch(url, options)
      })

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(VALID_LEAD),
      })

      await POST(request)

      // Verify webhook was called with signature header
      expect(capturedHeaders).toBeDefined()
      expect(capturedHeaders).toHaveProperty('X-Webhook-Signature')
      expect(capturedHeaders['X-Webhook-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/)

      global.fetch = originalFetch
    })
  })
})
