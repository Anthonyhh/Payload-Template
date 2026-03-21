/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock cache to avoid Redis/TTL dependency in tests
vi.mock('@/lib/cache', () => {
  const mockHealthCache = {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    getStats: vi.fn().mockReturnValue({ hits: 0, misses: 0, size: 0 }),
  }
  return {
    healthCache: mockHealthCache,
    withCache: vi.fn(async (_cache: unknown, _key: string, fn: () => Promise<unknown>) => {
      const data = await fn()
      return { data, cached: false }
    }),
  }
})

// Mock monitoring to avoid circular process dependency issues in test
vi.mock('@/lib/monitoring', () => ({
  performanceMonitor: {
    getMetrics: vi.fn().mockReturnValue([]),
    recordMetric: vi.fn(),
  },
  Timer: vi.fn().mockImplementation(() => ({
    end: vi.fn(),
  })),
}))

// Mock cache-middleware to return simple JSON responses
vi.mock('@/lib/cache-middleware', () => ({
  handleConditionalRequests: vi.fn().mockReturnValue(null),
  createCachedResponse: vi.fn(),
  CACHE_CONFIGS: {
    health: { maxAge: 15, sMaxAge: 15, staleWhileRevalidate: 60 },
  },
}))

// Mock compression to return plain NextResponse for easy testing
vi.mock('@/lib/compression', () => ({
  createCompressedResponse: vi.fn((data: unknown, _req: unknown, options?: { status?: number }) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json(data, { status: options?.status ?? 200 })
  }),
}))

const { GET } = await import('./route')

describe('GET /api/health', () => {
  it('returns 200 with status healthy', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.status).toBe('healthy')
    expect(body.timestamp).toBeDefined()
    expect(typeof body.uptime).toBe('number')
    expect(body.uptime).toBeGreaterThan(0)
  })

  it('response body contains memory and cache fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const body = await response.json()

    expect(body.memory).toBeDefined()
    expect(typeof body.memory.heapUsed).toBe('number')
    expect(body.cache).toBeDefined()
  })

  it('returns 200 within 2 seconds', async () => {
    const start = Date.now()
    const request = new NextRequest('http://localhost:3000/api/health')
    await GET(request)
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(2000)
  })
})
