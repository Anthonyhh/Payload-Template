import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as healthGet } from './health/route'
import { GET as metricsGet } from './metrics/route'
import { POST as leadsPost } from './leads/route'

// Mock the database and external dependencies
vi.mock('@/lib/db', () => ({
  dbConnectionPool: {
    healthCheck: vi.fn().mockResolvedValue(true),
    getStats: vi.fn().mockReturnValue({
      active: 0,
      idle: 3,
      total: 3,
    }),
  },
  withDbConnection: vi.fn(),
  optimizedQuery: vi.fn(),
}))

vi.mock('@/lib/monitoring', () => ({
  performanceMonitor: {
    getMetrics: vi.fn().mockReturnValue([
      { type: 'counter', name: 'test_metric', value: 1, timestamp: new Date().toISOString() },
      { type: 'histogram', name: 'test_duration', value: 100, timestamp: new Date().toISOString() },
    ]),
    recordHistogram: vi.fn(),
    incrementCounter: vi.fn(),
    recordApiRequest: vi.fn(),
    recordLeadSubmission: vi.fn(),
    recordValidationError: vi.fn(),
  },
  Timer: vi.fn().mockImplementation(() => ({
    stop: vi.fn().mockReturnValue(10),
  })),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    leadSubmissionStarted: vi.fn(),
    leadSubmissionSuccess: vi.fn(),
    leadSubmissionError: vi.fn(),
    validationError: vi.fn(),
    databaseError: vi.fn(),
    webhookNotificationStarted: vi.fn(),
    webhookNotificationSuccess: vi.fn(),
    webhookNotificationError: vi.fn(),
  },
}))

vi.mock('@/lib/email', () => ({
  emailService: {
    sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-message-id' }),
  },
  leadNotificationTemplates: {
    newLead: { subject: 'New Lead', template: 'template' },
    leadAlert: { subject: 'Lead Alert', template: 'template' },
  },
}))

vi.mock('@/lib/sanitization', () => ({
  dataSanitizer: {
    sanitizeObject: vi.fn().mockImplementation((data) => data),
  },
  leadFormSanitizationSchema: {},
}))

vi.mock('@/lib/validations', () => ({
  leadFormSchema: {
    parse: vi.fn().mockImplementation((data) => ({
      name: 'Test User',
      email: 'test@example.com',
      service: 'agentic-ai',
      consent: true,
      ...data,
    })),
  },
}))

describe('API Caching Integration', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any timers or async operations
    vi.clearAllTimers()
  })

  describe('Health API caching', () => {
    test('returns health status with compression headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        headers: { 'Accept-Encoding': 'gzip, br' },
      })

      const response = await healthGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Content-Encoding')).toBe('br')
      expect(response.headers.get('Vary')).toBe('Accept-Encoding')
      expect(response.headers.get('Cache-Control')).toContain('max-age=')

      expect(data.status).toBe('healthy')
      expect(data.timestamp).toBeTruthy()
      expect(data.uptime).toBeTypeOf('number')
      expect(data.memory).toBeDefined()
      expect(data.database).toBeDefined()
      expect(data.cache).toBeDefined()
    })

    test('handles unhealthy database with proper caching', async () => {
      // Mock unhealthy database
      const { dbConnectionPool } = await import('@/lib/db')
      vi.mocked(dbConnectionPool.healthCheck).mockResolvedValueOnce(false)

      const request = new NextRequest('http://localhost:3000/api/health')

      const response = await healthGet(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(response.headers.get('Cache-Control')).toContain('max-age=5')
    })

    test('respects conditional requests (ETags)', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        headers: {
          'If-None-Match': '"test-etag"',
          'Accept-Encoding': 'gzip',
        },
      })

      const response = await healthGet(request)

      // First request should return full response
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Encoding')).toBe('gzip')
    })
  })

  describe('Metrics API caching', () => {
    test('returns metrics with compression and caching headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics', {
        headers: { 'Accept-Encoding': 'br, gzip' },
      })

      const response = await metricsGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Encoding')).toBe('br')
      expect(response.headers.get('X-Compression-Estimate')).toBeTruthy()
      expect(response.headers.get('Cache-Control')).toContain('max-age=')

      expect(data.metrics).toBeDefined()
      expect(Array.isArray(data.metrics)).toBe(true)
      expect(data.summary).toBeDefined()
      expect(data.cache).toBeDefined()
    })

    test('optimizes metrics for production', async () => {
      // Mock production environment using vi.stubEnv
      const originalEnv = process.env.NODE_ENV
      vi.stubEnv('NODE_ENV', 'production')

      const { performanceMonitor } = await import('@/lib/monitoring')
      vi.mocked(performanceMonitor.getMetrics).mockReturnValue(
        Array(300)
          .fill(0)
          .map((_, i) => ({
            type: 'counter',
            name: `metric_${i}`,
            value: i,
            timestamp: new Date().toISOString(),
          }))
      )

      const request = new NextRequest('http://localhost:3000/api/metrics')

      const response = await metricsGet(request)
      const data = await response.json()

      expect(data.metrics.length).toBe(200) // Limited to 200 in production
      expect(data.totalCount).toBe(300) // But total count is preserved

      // Restore environment
      vi.unstubAllEnvs()
    })
  })

  describe('Leads API with duplicate detection', () => {
    test('accepts valid lead submission with compression', async () => {
      // Mock successful database operation
      const { withDbConnection } = await import('@/lib/db')
      vi.mocked(withDbConnection).mockResolvedValue({
        data: {
          id: 'test-lead-id',
          name: 'Test User',
          email: 'test@example.com',
          service: 'agentic-ai',
          consent: true,
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const validLead = {
        name: 'Test User',
        email: 'test@example.com',
        service: 'agentic-ai',
        consent: true,
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip',
        },
        body: JSON.stringify(validLead),
      })

      const response = await leadsPost(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Encoding')).toBe('gzip')
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')

      expect(data.data).toBeDefined()
      expect(data.data.id).toBe('test-lead-id')
      expect(data.error).toBeNull()
    })

    test('blocks duplicate submissions with proper response', async () => {
      const validLead = {
        name: 'Test User',
        email: 'duplicate@example.com',
        service: 'agentic-ai',
        consent: true,
      }

      const request1 = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.1',
        },
        body: JSON.stringify(validLead),
      })

      const request2 = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.1',
        },
        body: JSON.stringify(validLead),
      })

      const request3 = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.1',
        },
        body: JSON.stringify(validLead),
      })

      // Mock database for first two submissions
      const { withDbConnection } = await import('@/lib/db')
      vi.mocked(withDbConnection).mockResolvedValue({
        data: { id: 'test-id', ...validLead },
        error: null,
      })

      // First two should succeed
      const response1 = await leadsPost(request1)
      const response2 = await leadsPost(request2)

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Third should be blocked as duplicate
      const response3 = await leadsPost(request3)
      const data3 = await response3.json()

      expect(response3.status).toBe(429)
      expect(response3.headers.get('Retry-After')).toBeTruthy()
      expect(data3.error).toBe('Duplicate submission detected')
      expect(data3.retryAfter).toBeTypeOf('number')
      expect(data3.submissionCount).toBeDefined()
    })

    test('handles validation errors properly', async () => {
      const { leadFormSchema } = await import('@/lib/validations')
      vi.mocked(leadFormSchema.parse).mockImplementation(() => {
        const error = new Error('Validation failed')
        error.name = 'ZodError'
        throw error
      })

      const invalidLead = {
        name: '', // Invalid empty name
        email: 'invalid-email',
        service: 'invalid-service',
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidLead),
      })

      const response = await leadsPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    test('handles database errors gracefully', async () => {
      const { withDbConnection } = await import('@/lib/db')
      vi.mocked(withDbConnection).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const validLead = {
        name: 'Test User',
        email: 'test@example.com',
        service: 'agentic-ai',
        consent: true,
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validLead),
      })

      const response = await leadsPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save lead')
    })
  })

  describe('Compression behavior', () => {
    test('skips compression for requests without Accept-Encoding', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')

      const response = await healthGet(request)

      expect(response.headers.get('Content-Encoding')).toBeNull()
      expect(response.headers.get('Vary')).toBeNull()
    })

    test('prefers Brotli over gzip when both supported', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        headers: { 'Accept-Encoding': 'gzip, deflate, br' },
      })

      const response = await healthGet(request)

      expect(response.headers.get('Content-Encoding')).toBe('br')
    })

    test('falls back to gzip when Brotli not supported', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        headers: { 'Accept-Encoding': 'gzip, deflate' },
      })

      const response = await healthGet(request)

      expect(response.headers.get('Content-Encoding')).toBe('gzip')
    })

    test('includes Content-Length header for compressed responses', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics', {
        headers: { 'Accept-Encoding': 'gzip' },
      })

      const response = await metricsGet(request)

      expect(response.headers.get('Content-Length')).toBeTruthy()
      expect(parseInt(response.headers.get('Content-Length')!)).toBeGreaterThan(0)
    })
  })

  describe('Cache behavior', () => {
    test('sets appropriate cache headers for different endpoints', async () => {
      const healthRequest = new NextRequest('http://localhost:3000/api/health')
      const metricsRequest = new NextRequest('http://localhost:3000/api/metrics')

      const healthResponse = await healthGet(healthRequest)
      const metricsResponse = await metricsGet(metricsRequest)

      // Health endpoint should have shorter cache time
      expect(healthResponse.headers.get('Cache-Control')).toContain('max-age=30')

      // Metrics endpoint should have longer cache time
      expect(metricsResponse.headers.get('Cache-Control')).toContain('max-age=60')
    })

    test('serves cached responses when available', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/health')
      const request2 = new NextRequest('http://localhost:3000/api/health')

      await healthGet(request1) // First request populates cache
      const response2 = await healthGet(request2) // Second should use cache

      const data = await response2.json()
      expect(data.cache.cached).toBe(true)
    })
  })

  describe('Error handling', () => {
    test('handles errors gracefully with proper status codes', async () => {
      // Mock an error in the health check
      const { dbConnectionPool } = await import('@/lib/db')
      vi.mocked(dbConnectionPool.healthCheck).mockRejectedValue(new Error('Connection timeout'))

      const request = new NextRequest('http://localhost:3000/api/health')

      const response = await healthGet(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.error).toBeTruthy()
    })

    test('maintains proper error response compression', async () => {
      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip',
        },
        body: JSON.stringify({ invalid: 'data' }),
      })

      const response = await leadsPost(request)

      expect(response.status).toBe(400)
      expect(response.headers.get('Content-Encoding')).toBe('gzip')
    })
  })
})
