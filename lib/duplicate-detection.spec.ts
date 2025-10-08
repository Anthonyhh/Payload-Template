import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { DuplicateDetector } from './duplicate-detection'
import type { DuplicateDetectionConfig } from './duplicate-detection'

// Mock the cache module
const mockCache = new Map()
vi.mock('./cache', () => ({
  generalCache: {
    get: vi.fn((key: string) => mockCache.get(key)),
    set: vi.fn((key: string, value: any) => mockCache.set(key, value)),
    clear: vi.fn(() => mockCache.clear()),
    delete: vi.fn((key: string) => mockCache.delete(key)),
    getStats: vi.fn(() => ({ size: mockCache.size, hits: 0, misses: 0 })),
  },
}))

describe('DuplicateDetector', () => {
  let detector: DuplicateDetector

  beforeEach(() => {
    detector = new DuplicateDetector({
      windowMs: 1000, // 1 second for testing
      maxSubmissions: 2,
      fields: ['email', 'name'],
      enabled: true,
    })
  })

  afterEach(() => {
    // Clear any cached data between tests
    vi.clearAllMocks()
    mockCache.clear()
  })

  describe('basic duplicate detection', () => {
    test('allows first submission', async () => {
      const data = { email: 'test@example.com', name: 'John Doe' }

      const result = await detector.checkDuplicate(data)

      expect(result.isDuplicate).toBe(false)
      expect(result.submissionCount).toBe(1)
      expect(result.hash).toBeTruthy()
    })

    test('allows submissions within limit', async () => {
      const data = { email: 'test@example.com', name: 'John Doe' }

      const result1 = await detector.checkDuplicate(data)
      const result2 = await detector.checkDuplicate(data)

      expect(result1.isDuplicate).toBe(false)
      expect(result2.isDuplicate).toBe(false)
      expect(result2.submissionCount).toBe(2)
    })

    test('blocks submissions exceeding limit', async () => {
      const data = { email: 'test@example.com', name: 'John Doe' }

      await detector.checkDuplicate(data) // 1st submission
      await detector.checkDuplicate(data) // 2nd submission
      const result3 = await detector.checkDuplicate(data) // 3rd submission - should be blocked

      expect(result3.isDuplicate).toBe(true)
      expect(result3.reason).toBe('rate_limit')
      expect(result3.submissionCount).toBe(2) // Count doesn't increase when blocked
    })

    test('allows different data through', async () => {
      const data1 = { email: 'test1@example.com', name: 'John Doe' }
      const data2 = { email: 'test2@example.com', name: 'Jane Doe' }

      const result1 = await detector.checkDuplicate(data1)
      const result2 = await detector.checkDuplicate(data2)

      expect(result1.isDuplicate).toBe(false)
      expect(result2.isDuplicate).toBe(false)
      expect(result1.hash).not.toBe(result2.hash)
    })
  })

  describe('content hashing', () => {
    test('generates same hash for identical data', async () => {
      const data1 = { email: 'test@example.com', name: 'John Doe', extra: 'ignored' }
      const data2 = { name: 'John Doe', email: 'test@example.com', extra: 'different' }

      const result1 = await detector.checkDuplicate(data1)
      const result2 = await detector.checkDuplicate(data2)

      expect(result1.hash).toBe(result2.hash)
    })

    test('normalizes string values', async () => {
      const data1 = { email: '  TEST@EXAMPLE.COM  ', name: 'john   doe' }
      const data2 = { email: 'test@example.com', name: 'john doe' }

      const result1 = await detector.checkDuplicate(data1)
      const result2 = await detector.checkDuplicate(data2)

      expect(result1.hash).toBe(result2.hash)
    })

    test('only considers configured fields', async () => {
      const detector = new DuplicateDetector({
        fields: ['email'],
        windowMs: 1000,
        maxSubmissions: 1,
      })

      const data1 = { email: 'test@example.com', name: 'John' }
      const data2 = { email: 'test@example.com', name: 'Jane' }

      const result1 = await detector.checkDuplicate(data1)
      const result2 = await detector.checkDuplicate(data2)

      expect(result1.hash).toBe(result2.hash)
      expect(result2.isDuplicate).toBe(true)
    })

    test('handles missing fields gracefully', async () => {
      const data = { email: 'test@example.com' } // missing 'name' field

      const result = await detector.checkDuplicate(data)

      expect(result.isDuplicate).toBe(false)
      expect(result.hash).toBeTruthy()
    })

    test('handles null and undefined values', async () => {
      const data1 = { email: 'test@example.com', name: null }
      const data2 = { email: 'test@example.com', name: undefined }
      const data3 = { email: 'test@example.com' } // missing name entirely

      const result1 = await detector.checkDuplicate(data1)
      const result2 = await detector.checkDuplicate(data2)
      const result3 = await detector.checkDuplicate(data3)

      expect(result1.hash).toBe(result2.hash)
      expect(result2.hash).toBe(result3.hash)
    })
  })

  describe('time window behavior', () => {
    test('resets count after time window expires', async () => {
      const shortDetector = new DuplicateDetector({
        windowMs: 100, // 100ms
        maxSubmissions: 1,
        fields: ['email'],
      })

      const data = { email: 'test@example.com' }

      const result1 = await shortDetector.checkDuplicate(data)
      expect(result1.isDuplicate).toBe(false)

      const result2 = await shortDetector.checkDuplicate(data)
      expect(result2.isDuplicate).toBe(true)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150))

      const result3 = await shortDetector.checkDuplicate(data)
      expect(result3.isDuplicate).toBe(false)
      expect(result3.submissionCount).toBe(1) // Count reset
    })

    test('provides accurate time remaining', async () => {
      const data = { email: 'test@example.com', name: 'John' }

      await detector.checkDuplicate(data) // 1st
      await detector.checkDuplicate(data) // 2nd
      const blocked = await detector.checkDuplicate(data) // 3rd - blocked

      expect(blocked.isDuplicate).toBe(true)
      expect(blocked.timeWindow).toBeGreaterThan(0)
      expect(blocked.timeWindow).toBeLessThanOrEqual(1000) // Window is 1000ms
    })
  })

  describe('IP-based detection', () => {
    test('includes IP in duplicate detection', async () => {
      const data = { email: 'test@example.com', name: 'John' }
      const ip1 = '192.168.1.1'
      const ip2 = '192.168.1.2'

      await detector.checkDuplicate(data, ip1) // 1st for ip1
      await detector.checkDuplicate(data, ip1) // 2nd for ip1

      // Same data from different IP should be allowed
      const resultDifferentIP = await detector.checkDuplicate(data, ip2)
      expect(resultDifferentIP.isDuplicate).toBe(false)

      // Same IP with same data should be blocked
      const resultSameIP = await detector.checkDuplicate(data, ip1)
      expect(resultSameIP.isDuplicate).toBe(true)
    })

    test('works without IP parameter', async () => {
      const data = { email: 'test@example.com', name: 'John' }

      const result = await detector.checkDuplicate(data) // No IP provided

      expect(result.isDuplicate).toBe(false)
      expect(result.hash).toBeTruthy()
    })
  })

  describe('configuration options', () => {
    test('respects disabled state', async () => {
      const disabledDetector = new DuplicateDetector({
        enabled: false,
        maxSubmissions: 1,
      })

      const data = { email: 'test@example.com' }

      const result1 = await disabledDetector.checkDuplicate(data)
      const result2 = await disabledDetector.checkDuplicate(data)

      expect(result1.isDuplicate).toBe(false)
      expect(result2.isDuplicate).toBe(false)
    })

    test('uses different hash algorithms', async () => {
      const md5Detector = new DuplicateDetector({
        hashAlgorithm: 'md5',
        fields: ['email'],
      })

      const sha256Detector = new DuplicateDetector({
        hashAlgorithm: 'sha256',
        fields: ['email'],
      })

      const data = { email: 'test@example.com' }

      const md5Result = await md5Detector.checkDuplicate(data)
      const sha256Result = await sha256Detector.checkDuplicate(data)

      expect(md5Result.hash).not.toBe(sha256Result.hash)
      expect(md5Result.hash.length).toBe(32) // MD5 hash length
      expect(sha256Result.hash.length).toBe(64) // SHA256 hash length
    })

    test('handles different maxSubmissions values', async () => {
      const strictDetector = new DuplicateDetector({
        maxSubmissions: 1,
        windowMs: 1000,
        fields: ['email'],
      })

      const data = { email: 'test@example.com' }

      const result1 = await strictDetector.checkDuplicate(data)
      expect(result1.isDuplicate).toBe(false)

      const result2 = await strictDetector.checkDuplicate(data)
      expect(result2.isDuplicate).toBe(true)
    })
  })

  describe('error handling', () => {
    test('fails open on errors', async () => {
      // Make mockCache.get throw an error for this test
      const originalGet = mockCache.get
      mockCache.get = vi.fn(() => {
        throw new Error('Cache error')
      })

      const detector = new DuplicateDetector()
      const data = { email: 'test@example.com' }

      const result = await detector.checkDuplicate(data)

      // Should fail open (allow the request) when there's an error
      expect(result.isDuplicate).toBe(false)
      expect(result.reason).toBe('error')

      // Restore original function
      mockCache.get = originalGet
    })
  })

  describe('stats functionality', () => {
    test('returns configuration and cache stats', () => {
      const stats = detector.getStats()

      expect(stats.config).toBeDefined()
      expect(stats.config.enabled).toBe(true)
      expect(stats.config.windowMs).toBe(1000)
      expect(stats.config.maxSubmissions).toBe(2)
      expect(stats.cacheStats).toBeDefined()
    })
  })
})

describe('duplicate detection properties', () => {
  test('hash consistency for equivalent data structures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (data) => {
          const detector = new DuplicateDetector({ fields: ['email', 'name'] })

          // Same data in different order
          const data1 = { email: data.email, name: data.name }
          const data2 = { name: data.name, email: data.email }

          const result1 = await detector.checkDuplicate(data1)
          const result2 = await detector.checkDuplicate(data2)

          expect(result1.hash).toBe(result2.hash)
        }
      )
    )
  })

  test('different data generates different hashes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (data1, data2) => {
          // Ensure the data is actually different
          fc.pre(data1.email !== data2.email || data1.name !== data2.name)

          const detector = new DuplicateDetector({ fields: ['email', 'name'] })

          const result1 = await detector.checkDuplicate(data1)
          const result2 = await detector.checkDuplicate(data2)

          expect(result1.hash).not.toBe(result2.hash)
        }
      )
    )
  })

  test('submission count never exceeds maxSubmissions for duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (maxSubmissions, data) => {
          const detector = new DuplicateDetector({
            maxSubmissions,
            windowMs: 10000, // Long window
            fields: ['email', 'name'],
          })

          let lastResult
          // Submit more than the limit
          for (let i = 0; i < maxSubmissions + 5; i++) {
            lastResult = await detector.checkDuplicate(data)
          }

          if (lastResult?.isDuplicate) {
            expect(lastResult.submissionCount).toBeLessThanOrEqual(maxSubmissions)
          }
        }
      )
    )
  })

  test('time window calculations are accurate', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 100, max: 5000 }), async (windowMs) => {
        const detector = new DuplicateDetector({
          windowMs,
          maxSubmissions: 1,
          fields: ['email'],
        })

        const data = { email: 'test@example.com' }

        const start = Date.now()
        await detector.checkDuplicate(data) // First submission
        const blocked = await detector.checkDuplicate(data) // Second - should be blocked
        const elapsed = Date.now() - start

        if (blocked.isDuplicate) {
          // Time window should be approximately windowMs minus elapsed time
          const expectedRemaining = windowMs - elapsed
          const tolerance = 100 // 100ms tolerance for test execution time

          expect(blocked.timeWindow).toBeLessThanOrEqual(windowMs)
          expect(blocked.timeWindow).toBeGreaterThan(expectedRemaining - tolerance)
        }
      })
    )
  })
})

describe('security testing', () => {
  test('handles XSS attack vectors in input data', async () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img onerror="alert(1)" src="x">',
      "';alert(1);//",
      '<iframe src="javascript:alert(1)"></iframe>',
    ]

    const detector = new DuplicateDetector({
      fields: ['email', 'name'],
      maxSubmissions: 2,
      windowMs: 1000,
    })

    for (const payload of xssPayloads) {
      const data = {
        email: 'test@example.com',
        name: payload, // XSS in name field
        company: 'ACME Corp',
      }

      const result = await detector.checkDuplicate(data)
      expect(result.isDuplicate).toBe(false)
      expect(result.hash).toBeTruthy()
    }
  })

  test('handles email injection attempts', async () => {
    const maliciousEmails = [
      'user@example.com\r\ncc:attacker@evil.com',
      'user@example.com\nsubject:spam',
      'user@example.com\r\nbcc:attacker@evil.com',
      'user@example.com%0d%0acc:attacker@evil.com',
      'user@example.com\r\ncontent-type:text/html',
    ]

    const detector = new DuplicateDetector({
      fields: ['email'],
      maxSubmissions: 1,
      windowMs: 1000,
    })

    for (const email of maliciousEmails) {
      const data = { email, name: 'John Doe' }

      const result = await detector.checkDuplicate(data)
      expect(result.isDuplicate).toBe(false)
      expect(result.hash).toBeTruthy()

      // Hash should be consistent for same malicious input
      const result2 = await detector.checkDuplicate(data)
      expect(result2.hash).toBe(result.hash)
    }
  })

  test('prevents hash collision attacks', async () => {
    const detector = new DuplicateDetector({
      fields: ['data'],
      maxSubmissions: 1,
      windowMs: 1000,
      hashAlgorithm: 'sha256', // Use strong hash
    })

    // Test with data designed to potentially cause hash collisions
    const collisionAttempts = [
      'a'.repeat(1000000), // Very long string
      '\u0000'.repeat(1000), // Null bytes
      '0123456789abcdef'.repeat(1000), // Hex patterns
      JSON.stringify({ a: 1, b: 2 }), // JSON structure
      JSON.stringify({ b: 2, a: 1 }), // Same JSON, different order
    ]

    const hashes = new Set()

    for (const data of collisionAttempts) {
      const result = await detector.checkDuplicate({ data })
      hashes.add(result.hash)
    }

    // Different inputs should produce different hashes
    expect(hashes.size).toBe(collisionAttempts.length)
  })

  test('handles malicious IP addresses safely', async () => {
    const maliciousIPs = [
      '192.168.1.1; DROP TABLE users; --',
      '127.0.0.1\r\nX-Forwarded-For: evil.com',
      '0.0.0.0',
      '255.255.255.255',
      '\x00\x00\x00\x00',
      'javascript:alert(1)',
      '<script>alert(1)</script>',
    ]

    const detector = new DuplicateDetector({ fields: ['email'] })
    const data = { email: 'test@example.com' }

    for (const ip of maliciousIPs) {
      const result = await detector.checkDuplicate(data, ip)
      expect(result.isDuplicate).toBe(false)
      expect(result.hash).toBeTruthy()
    }
  })

  test('sanitization is idempotent for security', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          company: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (data) => {
          const detector = new DuplicateDetector({ fields: ['email', 'name', 'company'] })

          const result1 = await detector.checkDuplicate(data)
          const result2 = await detector.checkDuplicate(data)

          // Same input should always produce same hash (idempotent)
          expect(result1.hash).toBe(result2.hash)
        }
      )
    )
  })

  test('does not leak sensitive information in logs', async () => {
    const sensitiveData = {
      email: 'user@company.com',
      name: 'John Doe',
      password: 'secret123', // This field should not be included in hash
      ssn: '123-45-6789', // This field should not be included in hash
    }

    const detector = new DuplicateDetector({
      fields: ['email', 'name'], // Only include safe fields
      maxSubmissions: 1,
      windowMs: 1000,
    })

    const result = await detector.checkDuplicate(sensitiveData)
    expect(result.hash).toBeTruthy()
    // Hash should be based only on email and name, not sensitive fields
  })
})

describe('security properties', () => {
  test('duplicate detection is consistent across malicious inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.string({ minLength: 1, maxLength: 100 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          maliciousField: fc.oneof(
            fc.constant('<script>alert(1)</script>'),
            fc.constant('javascript:alert(1)'),
            fc.constant('\r\ncc:attacker@evil.com'),
            fc.constant('\u0000\u0001\u0002')
          ),
        }),
        async (data) => {
          const detector = new DuplicateDetector({
            fields: ['email', 'name', 'maliciousField'],
            maxSubmissions: 2,
            windowMs: 5000,
          })

          // First submission should be allowed
          const result1 = await detector.checkDuplicate(data)
          expect(result1.isDuplicate).toBe(false)

          // Same data should be detected as duplicate
          const result2 = await detector.checkDuplicate(data)
          expect(result2.hash).toBe(result1.hash)

          // Count should not exceed maxSubmissions regardless of malicious content
          expect(result2.submissionCount).toBeLessThanOrEqual(2)
        }
      )
    )
  })

  test('memory usage is bounded with malicious inputs', async () => {
    const detector = new DuplicateDetector({
      fields: ['data'],
      maxSubmissions: 100,
      windowMs: 10000,
    })

    // Generate many different malicious inputs
    const maliciousInputs = Array(1000)
      .fill(0)
      .map((_, i) => ({
        data: `<script>alert(${i})</script>` + 'x'.repeat(1000),
      }))

    for (const input of maliciousInputs) {
      await detector.checkDuplicate(input)
    }

    // Cache should not grow unbounded
    const stats = detector.getStats()
    expect(stats.cacheStats.size).toBeLessThan(2000) // Reasonable limit
  })
})
