import { logger } from './logger'
import { performanceMonitor } from './monitoring'

export type RateLimitConfig = {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (identifier: string) => string
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetTime: number
  totalRequests: number
}

export type RateLimitInfo = {
  requests: number
  windowStart: number
  blocked: number
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitInfo>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    )
  }

  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    Array.from(this.store.entries()).forEach(([key, info]) => {
      // Remove entries older than 1 hour
      if (now - info.windowStart > 60 * 60 * 1000) {
        this.store.delete(key)
        cleanedCount++
      }
    })

    if (cleanedCount > 0) {
      logger.debug(`Rate limiter cleaned up ${cleanedCount} expired entries`)
    }
  }

  private getKey(identifier: string, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(identifier)
    }
    return `ratelimit:${identifier}`
  }

  check(identifier: string, config: RateLimitConfig): RateLimitResult {
    const key = this.getKey(identifier, config)
    const now = Date.now()

    let info = this.store.get(key)

    // Initialize or reset window if expired
    if (!info || now - info.windowStart >= config.windowMs) {
      info = {
        requests: 0,
        windowStart: now,
        blocked: 0,
      }
      this.store.set(key, info)
    }

    const timeRemaining = config.windowMs - (now - info.windowStart)
    const resetTime = info.windowStart + config.windowMs

    // Check if request is allowed
    if (info.requests >= config.maxRequests) {
      info.blocked++

      // Log rate limit exceeded
      logger.warn('Rate limit exceeded', {
        identifier,
        requests: info.requests,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        blocked: info.blocked,
      })

      // Record rate limit metric
      performanceMonitor.incrementCounter('rate_limit_exceeded_total', {
        identifier: this.sanitizeIdentifier(identifier),
      })

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        totalRequests: info.requests,
      }
    }

    // Allow request and increment counter
    info.requests++

    // Record successful rate limit check
    performanceMonitor.incrementCounter('rate_limit_checks_total', {
      identifier: this.sanitizeIdentifier(identifier),
      result: 'allowed',
    })

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - info.requests),
      resetTime,
      totalRequests: info.requests,
    }
  }

  private sanitizeIdentifier(identifier: string): string {
    // Remove PII from identifiers for metrics
    if (identifier.includes('@')) {
      return 'email'
    }
    if (identifier.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      return 'ip'
    }
    return 'other'
  }

  // Get current state for monitoring
  getStats(): { totalKeys: number; totalRequests: number; totalBlocked: number } {
    let totalRequests = 0
    let totalBlocked = 0

    Array.from(this.store.values()).forEach((info) => {
      totalRequests += info.requests
      totalBlocked += info.blocked
    })

    return {
      totalKeys: this.store.size,
      totalRequests,
      totalBlocked,
    }
  }

  // Reset specific key (for testing or manual intervention)
  reset(identifier: string, config: RateLimitConfig): void {
    const key = this.getKey(identifier, config)
    this.store.delete(key)
    logger.info('Rate limit reset', { identifier })
  }

  // Clear all entries
  clear(): void {
    this.store.clear()
    logger.info('Rate limiter cleared')
  }

  // Cleanup method for graceful shutdown
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Singleton instance
export const rateLimiter = new InMemoryRateLimiter()

// Common rate limiting configurations
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  },

  // Lead submission endpoint (more restrictive)
  leads: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 lead submissions per hour
  },

  // Monitoring endpoints (less restrictive)
  monitoring: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50, // 50 requests per 5 minutes
  },

  // Strict rate limiting for security
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },
}

// Helper function to create rate limit middleware
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (identifier: string): RateLimitResult => {
    return rateLimiter.check(identifier, config)
  }
}

// Get rate limit headers for HTTP responses
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.totalRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)), // Unix timestamp
  }
}
