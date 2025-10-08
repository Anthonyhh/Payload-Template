import { createHash } from 'crypto'
import { generalCache } from './cache'
import { logger } from './logger'
import { performanceMonitor, Timer } from './monitoring'

export type DuplicateDetectionConfig = {
  enabled: boolean
  windowMs: number
  maxSubmissions: number
  fields: string[]
  hashAlgorithm: 'md5' | 'sha1' | 'sha256'
}

const defaultConfig: DuplicateDetectionConfig = {
  enabled: true,
  windowMs: 300000, // 5 minutes
  maxSubmissions: 3, // Max 3 submissions per 5 minutes for same data
  fields: ['email', 'name', 'service'], // Fields to consider for duplicate detection
  hashAlgorithm: 'sha256',
}

export class DuplicateDetector {
  private config: DuplicateDetectionConfig

  constructor(config: Partial<DuplicateDetectionConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  async checkDuplicate<T extends Record<string, any>>(
    data: T,
    clientIP?: string
  ): Promise<{
    isDuplicate: boolean
    hash: string
    submissionCount: number
    timeWindow: number
    reason?: string
  }> {
    if (!this.config.enabled) {
      return {
        isDuplicate: false,
        hash: '',
        submissionCount: 0,
        timeWindow: 0,
      }
    }

    const timer = new Timer()

    try {
      // Create content hash from specified fields
      const contentHash = this.createContentHash(data)

      // Create composite key including IP for additional protection
      const compositeKey = clientIP ? `${contentHash}:${this.hashString(clientIP)}` : contentHash

      const cacheKey = `duplicate:${compositeKey}`

      // Get existing submission count
      const existing = generalCache.get(cacheKey) as { count: number; firstSeen: number } | null
      const now = Date.now()
      let currentCount = 1

      if (existing) {
        const ageMs = now - existing.firstSeen

        // If within time window, check count
        if (ageMs < this.config.windowMs) {
          if (existing.count >= this.config.maxSubmissions) {
            const duration = timer.stop()

            performanceMonitor.recordHistogram('duplicate_detection_duration_ms', duration)
            performanceMonitor.incrementCounter('duplicate_submissions_total', {
              reason: 'rate_limit',
              result: 'blocked',
            })

            logger.warn('Duplicate submission blocked', {
              hash: contentHash.substring(0, 8),
              count: existing.count,
              ageMs,
              clientIP: clientIP ? this.obscureIP(clientIP) : undefined,
            })

            return {
              isDuplicate: true,
              hash: contentHash,
              submissionCount: existing.count,
              timeWindow: this.config.windowMs - ageMs,
              reason: 'rate_limit',
            }
          }

          // Increment count within window
          currentCount = existing.count + 1
          generalCache.set(
            cacheKey,
            {
              count: currentCount,
              firstSeen: existing.firstSeen,
            },
            this.config.windowMs
          )
        } else {
          // Time window expired, reset count
          currentCount = 1
          generalCache.set(
            cacheKey,
            {
              count: currentCount,
              firstSeen: now,
            },
            this.config.windowMs
          )
        }
      } else {
        // First submission
        currentCount = 1
        generalCache.set(
          cacheKey,
          {
            count: currentCount,
            firstSeen: now,
          },
          this.config.windowMs
        )
      }

      const duration = timer.stop()
      performanceMonitor.recordHistogram('duplicate_detection_duration_ms', duration)
      performanceMonitor.incrementCounter('duplicate_detection_checks_total', {
        result: 'allowed',
      })

      logger.debug('Duplicate check passed', {
        hash: contentHash.substring(0, 8),
        newCount: currentCount,
        duration,
      })

      return {
        isDuplicate: false,
        hash: contentHash,
        submissionCount: currentCount,
        timeWindow: this.config.windowMs,
      }
    } catch (error) {
      const duration = timer.stop()

      performanceMonitor.incrementCounter('duplicate_detection_errors_total', {
        result: 'error',
      })

      logger.error(
        'Duplicate detection failed',
        { duration },
        error instanceof Error ? error : new Error('Unknown duplicate detection error')
      )

      // On error, allow submission (fail open)
      return {
        isDuplicate: false,
        hash: '',
        submissionCount: 0,
        timeWindow: 0,
        reason: 'error',
      }
    }
  }

  private createContentHash<T extends Record<string, any>>(data: T): string {
    // Extract only the fields we care about for duplicate detection
    const relevantData: Record<string, any> = {}

    for (const field of this.config.fields) {
      if (field in data && data[field] != null) {
        // Normalize the data for consistent hashing
        relevantData[field] = this.normalizeValue(data[field])
      }
    }

    // Create deterministic JSON string
    const dataString = JSON.stringify(relevantData, Object.keys(relevantData).sort())

    return this.hashString(dataString)
  }

  private normalizeValue(value: any): any {
    if (typeof value === 'string') {
      // Normalize strings: lowercase, trim, remove extra whitespace
      return value.toLowerCase().trim().replace(/\s+/g, ' ')
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.normalizeValue(v)).sort()
    }

    if (typeof value === 'object' && value !== null) {
      const normalized: Record<string, any> = {}
      for (const [key, val] of Object.entries(value)) {
        normalized[key] = this.normalizeValue(val)
      }
      return normalized
    }

    return value
  }

  private hashString(input: string): string {
    return createHash(this.config.hashAlgorithm).update(input).digest('hex')
  }

  private obscureIP(ip: string): string {
    // Obscure IP for logging while maintaining uniqueness
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`
    }

    // For IPv6 or other formats, just show first part
    return ip.split(':')[0] + ':xxxx'
  }

  getStats(): {
    config: DuplicateDetectionConfig
    cacheStats: any
  } {
    return {
      config: this.config,
      cacheStats: generalCache.getStats(),
    }
  }
}

// Global instance
export const duplicateDetector = new DuplicateDetector({
  windowMs: 300000, // 5 minutes
  maxSubmissions: 2, // Allow max 2 identical submissions per 5 minutes
  fields: ['email', 'service', 'company'], // Focus on key identifying fields
})

// Specialized detectors for different use cases
export const strictDuplicateDetector = new DuplicateDetector({
  windowMs: 900000, // 15 minutes
  maxSubmissions: 1, // Only 1 submission per 15 minutes
  fields: ['email', 'name', 'service', 'company', 'website'],
})

export const lenientDuplicateDetector = new DuplicateDetector({
  windowMs: 180000, // 3 minutes
  maxSubmissions: 5, // Allow more submissions for testing
  fields: ['email'],
})
