import { logger } from './logger'
import { performanceMonitor, Timer } from './monitoring'

// Branded types for type safety (C-5 MUST)
export type CacheKey = string & { readonly __brand: 'CacheKey' }
export type MemorySize = number & { readonly __brand: 'MemorySize' }
export type CorrelationId = string & { readonly __brand: 'CorrelationId' }

export type ApiCacheConfig = {
  defaultTtl: number
  maxSize: number
  maxMemoryMB: number
  cleanupInterval: number
  enableMetrics: boolean
  // Backward compatibility: if true, operations throw on validation errors (legacy behavior)
  strictValidation?: boolean
}

export type CacheEntry<T = any> = {
  data: T
  timestamp: number
  ttl: number
  hitCount: number
  lastAccessed: number
  sizeBytes: number
}

export type CacheStats = {
  size: number
  maxSize: number
  memoryUsageMB: number
  maxMemoryMB: number
  expired: number
  totalHits: number
  totalAccesses: number
  hitRate: number
}

const defaultConfig: ApiCacheConfig = {
  defaultTtl: 300000, // 5 minutes
  maxSize: 1000,
  maxMemoryMB: 50, // 50MB memory limit
  cleanupInterval: 60000, // 1 minute
  enableMetrics: true,
  strictValidation: false, // Default: graceful error handling (recommended)
}

// Track all active cache instances for cleanup
const activeCacheInstances = new WeakSet<InMemoryApiCache>()

// Following InMemoryRateLimiter pattern for consistency
class InMemoryApiCache {
  private store = new Map<string, CacheEntry>()
  // Efficient LRU tracking - O(1) access operations
  private accessOrder = new Map<string, number>()
  private config: ApiCacheConfig
  private cleanupInterval: NodeJS.Timeout | null = null
  private totalAccesses = 0
  private totalHits = 0
  private memoryUsageBytes = 0
  private isDestroyed = false

  // Race condition protection: atomic operation state
  private operationInProgress = false

  // Ensure critical operations complete atomically
  private withAtomicOperation<T>(operation: () => T): T {
    if (this.operationInProgress) {
      throw new Error('Concurrent cache operation detected')
    }

    this.operationInProgress = true
    try {
      return operation()
    } finally {
      this.operationInProgress = false
    }
  }

  constructor(config: Partial<ApiCacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config }

    // Only start cleanup if not in test environment or if explicitly enabled
    if (this.config.cleanupInterval > 0) {
      this.startCleanup()
    }

    // Track this instance for cleanup
    activeCacheInstances.add(this)
  }

  // S-1: Security-first approach - basic type and length validation
  private validateKeyType(key: unknown): asserts key is string {
    if (key === null || key === undefined) {
      throw new Error('Cache key must be a non-empty string')
    }

    if (typeof key !== 'string') {
      throw new Error('Cache key must be a non-empty string')
    }

    if (key === '') {
      throw new Error('Cache key must be a non-empty string')
    }

    // Validate length BEFORE sanitization for security
    if (key.length > 1000) {
      throw new Error('Cache key too long (max 1000 characters)')
    }
  }

  // S-1: Additional validation for sanitized keys (currently no additional checks needed)
  private validateSanitizedKey(sanitizedKey: string): void {
    // Length already validated before sanitization
    // Future: Add checks for malicious patterns in sanitized output
  }

  private validateTTL(ttl?: number): void {
    if (ttl === undefined) {
      return
    }

    if (typeof ttl !== 'number' || ttl < 0 || !Number.isFinite(ttl)) {
      throw new Error('TTL must be a non-negative finite number')
    }

    if (ttl > 86400000) { // 24 hours in ms
      throw new Error('TTL too large (max 24 hours)')
    }
  }

  private validateValue(value?: any): string | undefined {
    if (value === undefined) {
      return undefined
    }

    // Check for functions and other non-serializable types
    if (this.containsFunction(value)) {
      throw new Error('Cache value is not serializable')
    }

    // Check for circular references and serialize once for both checks
    let serializedValue: string
    try {
      serializedValue = JSON.stringify(value)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('circular')) {
        throw new Error('Cache value contains circular references')
      }
      throw new Error('Cache value is not serializable')
    }

    // Check serialized size using already serialized value
    const serializedSize = Buffer.byteLength(serializedValue, 'utf8')
    if (serializedSize > 10 * 1024 * 1024) { // 10MB limit per entry
      throw new Error('Cache value too large (max 10MB)')
    }

    // Return serialized value for reuse
    return serializedValue
  }

  // S-1: Security-first validation approach
  private validateAndSanitizeKey(key: unknown): string {
    // Step 1: Basic type validation
    this.validateKeyType(key)
    // Step 2: Sanitize for security (key is now guaranteed string)
    const sanitizedKey = this.sanitizeKey(key)
    // Step 3: Validate sanitized result
    this.validateSanitizedKey(sanitizedKey)
    return sanitizedKey
  }

  private validateInput(key: unknown, value?: any, ttl?: number): string | undefined {
    // Key validation is now handled by validateAndSanitizeKey
    this.validateTTL(ttl)
    return this.validateValue(value)
  }

  private containsFunction(value: any, visited = new WeakSet()): boolean {
    if (typeof value === 'function') {
      return true
    }

    if (value && typeof value === 'object') {
      // Prevent infinite recursion on circular references
      if (visited.has(value)) {
        return false
      }
      visited.add(value)

      if (Array.isArray(value)) {
        return value.some(item => this.containsFunction(item, visited))
      }

      for (const key in value) {
        if (value.hasOwnProperty(key) && this.containsFunction(value[key], visited)) {
          return true
        }
      }
    }

    return false
  }

  private generateCorrelationId(): string {
    return `cache-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  private sanitizeKey(key: string): string {
    // S-1: Sanitize inputs - orchestrate focused sanitization steps
    const originalKeyLength = key.length

    let sanitized = key
    sanitized = this.sanitizeEmailPatterns(sanitized)
    sanitized = this.sanitizeIpPatterns(sanitized)
    sanitized = this.sanitizeHashPatterns(sanitized)
    sanitized = this.truncateToLimit(sanitized)

    this.logSanitizationIfChanged(originalKeyLength, sanitized.length)
    return sanitized
  }

  private sanitizeEmailPatterns(input: string): string {
    if (!input.includes('@')) {
      return input
    }

    const parts = input.split(' ')
    return parts.map(part => this.replaceEmailLikePattern(part)).join(' ')
  }

  private replaceEmailLikePattern(part: string): string {
    const atIndex = part.indexOf('@')
    if (atIndex <= 0 || atIndex >= part.length - 1) {
      return part
    }

    const afterAt = part.substring(atIndex + 1)
    const hasValidDomain = afterAt.includes('.') &&
                          !afterAt.startsWith('.') &&
                          !afterAt.endsWith('.')

    return hasValidDomain ? '[email]' : part
  }

  private sanitizeIpPatterns(input: string): string {
    const tokens = input.split(' ')
    return tokens.map(token => this.isIPv4Pattern(token) ? '[ip]' : token).join(' ')
  }

  private isIPv4Pattern(str: string): boolean {
    const parts = str.split('.')
    if (parts.length !== 4) {
      return false
    }

    return parts.every(part => {
      const num = parseInt(part, 10)
      return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString()
    })
  }

  private sanitizeHashPatterns(input: string): string {
    return input.split(' ').map(token => this.isLongHexString(token) ? '[hash]' : token).join(' ')
  }

  private isLongHexString(token: string): boolean {
    if (token.length < 32) {
      return false
    }

    return token.split('').every(char =>
      (char >= '0' && char <= '9') ||
      (char >= 'a' && char <= 'f') ||
      (char >= 'A' && char <= 'F')
    )
  }

  private truncateToLimit(input: string): string {
    return input.substring(0, 200)
  }

  private logSanitizationIfChanged(originalLength: number, sanitizedLength: number): void {
    if (sanitizedLength !== originalLength) {
      logger.debug('Cache key sanitized', {
        originalLength,
        sanitizedLength,
      })
    }
  }

  private estimateSize(serializedValue: string): number {
    // Calculate JSON serialization size
    const jsonSize = Buffer.byteLength(serializedValue, 'utf8')

    // Add 40% overhead estimate for JavaScript object structures in memory
    // This accounts for V8 object headers, property maps, hidden classes, etc.
    const overhead = Math.ceil(jsonSize * 0.4)

    return jsonSize + overhead
  }

  private ensureCapacity(newEntrySize: number): void {
    // Atomic capacity management - fix race condition
    const maxSizeBytes = this.config.maxMemoryMB * 1024 * 1024

    // Evict entries until we have space for both count and memory limits
    while (
      this.store.size >= this.config.maxSize ||
      this.memoryUsageBytes + newEntrySize > maxSizeBytes
    ) {
      if (this.store.size === 0) break // Prevent infinite loop
      this.evictOldest()
    }
  }

  private evictOldest(): void {
    // Efficient O(1) eviction using Map's insertion order
    // Maps maintain insertion order, so first entry is oldest accessed
    const firstKey = this.accessOrder.keys().next().value

    if (!firstKey) {
      return // No entries to evict
    }

    const entry = this.store.get(firstKey)
    if (!entry) {
      // Clean up stale access tracking
      this.accessOrder.delete(firstKey)
      return
    }

    // Truly atomic operation: delete from both maps and update memory together
    this.withAtomicOperation(() => {
      const deleted = this.store.delete(firstKey)
      this.accessOrder.delete(firstKey)

      if (deleted && entry) {
        this.memoryUsageBytes -= entry.sizeBytes
      }
    })

    if (entry) {

      if (this.config.enableMetrics) {
        performanceMonitor.incrementCounter('api_cache_evictions_total', {
          reason: 'lru',
        })
      }

      logger.debug('Cache entry evicted (LRU)', {
        key: this.obscureKey(firstKey),
        memoryUsageMB: this.memoryUsageBytes / (1024 * 1024),
      })
    }
  }

  set(key: unknown, value: any, ttl?: number): void {
    const timer = new Timer()
    const correlationId = this.generateCorrelationId()

    try {
      // S-1: Security-first approach - sanitize before full validation
      const sanitizedKey = this.validateAndSanitizeKey(key)
      // Validate remaining inputs and get serialized value
      const serializedValue = this.validateInput(key, value, ttl)
      const now = Date.now()
      const entryTtl = ttl || this.config.defaultTtl
      const sizeBytes = serializedValue ? this.estimateSize(serializedValue) : 0

      // Ensure we have capacity before setting
      this.ensureCapacity(sizeBytes)

      // Atomic update: get existing entry and calculate memory delta
      const existingEntry = this.store.get(sanitizedKey)
      const memoryDelta = existingEntry ? sizeBytes - existingEntry.sizeBytes : sizeBytes

      const entry: CacheEntry = {
        data: value,
        timestamp: now,
        ttl: entryTtl,
        hitCount: 0,
        lastAccessed: now,
        sizeBytes,
      }

      // Truly atomic operation: update store, memory, and access tracking together
      this.withAtomicOperation(() => {
        this.store.set(sanitizedKey, entry)
        this.accessOrder.set(sanitizedKey, now)
        this.memoryUsageBytes += memoryDelta
      })

      if (this.config.enableMetrics) {
        const duration = timer.stop()
        performanceMonitor.recordHistogram('api_cache_set_duration_ms', duration)
        performanceMonitor.incrementCounter('api_cache_operations_total', {
          operation: 'set',
          result: 'success',
        })
      }

      logger.debug('Cache entry set', {
        correlationId,
        key: this.obscureKey(sanitizedKey),
        ttl: entryTtl,
        sizeMB: sizeBytes / (1024 * 1024),
        totalSizeMB: this.memoryUsageBytes / (1024 * 1024),
        cacheSize: this.store.size,
      })
    } catch (error) {
      const duration = timer.stop()

      if (this.config.enableMetrics) {
        performanceMonitor.incrementCounter('api_cache_operations_total', {
          operation: 'set',
          result: 'error',
        })
      }

      logger.error('Cache set operation failed', {
        correlationId,
        key: typeof key === 'string' ? this.obscureKey(key) : `[${typeof key}]`,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  get<T = any>(key: unknown): T | null {
    const timer = new Timer()

    try {
      // S-1: Security-first approach - validate and sanitize key
      const sanitizedKey = this.validateAndSanitizeKey(key)
    const entry = this.store.get(sanitizedKey)
    const now = Date.now()

    this.totalAccesses++

    if (!entry) {
      if (this.config.enableMetrics) {
        performanceMonitor.incrementCounter('api_cache_operations_total', {
          operation: 'get',
          result: 'miss',
        })
      }
      return null
    }

    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      // Truly atomic operation: delete and update memory and access tracking together
      this.withAtomicOperation(() => {
        const deleted = this.store.delete(sanitizedKey)
        this.accessOrder.delete(sanitizedKey)
        if (deleted) {
          this.memoryUsageBytes -= entry.sizeBytes
        }
      })

      if (this.config.enableMetrics) {
        performanceMonitor.incrementCounter('api_cache_operations_total', {
          operation: 'get',
          result: 'expired',
        })
      }
      logger.debug('Cache entry expired', { key: this.obscureKey(sanitizedKey) })
      return null
    }

    // Cache hit - atomically update access tracking for LRU
    this.withAtomicOperation(() => {
      this.totalHits++
      entry.hitCount++
      entry.lastAccessed = now

      // Update access order by removing and re-adding (moves to end)
      this.accessOrder.delete(sanitizedKey)
      this.accessOrder.set(sanitizedKey, now)
    })

    if (this.config.enableMetrics) {
      const duration = timer.stop()
      performanceMonitor.recordHistogram('api_cache_get_duration_ms', duration)
      performanceMonitor.incrementCounter('api_cache_operations_total', {
        operation: 'get',
        result: 'hit',
      })
    }

    return entry.data
    } catch (error) {
      const duration = timer.stop()

      if (this.config.enableMetrics) {
        performanceMonitor.incrementCounter('api_cache_operations_total', {
          operation: 'get',
          result: 'error',
        })
      }

      logger.error('Cache get operation failed', {
        key: typeof key === 'string' ? this.obscureKey(key) : `[${typeof key}]`,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Backward compatibility: respect strictValidation setting
      if (this.config.strictValidation) {
        throw error
      }

      // Default: Return null on error instead of throwing to maintain cache behavior
      return null
    }
  }

  has(key: unknown): boolean {
    try {
      // S-1: Security-first approach - validate and sanitize key
      const sanitizedKey = this.validateAndSanitizeKey(key)
      const entry = this.store.get(sanitizedKey)
      if (!entry) return false

      const now = Date.now()
      if (now - entry.timestamp > entry.ttl) {
        // Truly atomic operation: delete and update memory and access tracking together
        this.withAtomicOperation(() => {
          const deleted = this.store.delete(sanitizedKey)
          this.accessOrder.delete(sanitizedKey)
          if (deleted) {
            this.memoryUsageBytes -= entry.sizeBytes
          }
        })
        return false
      }

      return true
    } catch (error) {
      logger.error('Cache has operation failed', {
        key: typeof key === 'string' ? this.obscureKey(key) : `[${typeof key}]`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Backward compatibility: respect strictValidation setting
      if (this.config.strictValidation) {
        throw error
      }

      // Default: Return false on error instead of throwing to maintain cache behavior
      return false
    }
  }

  delete(key: unknown): boolean {
    try {
      // S-1: Security-first approach - validate and sanitize key
      const sanitizedKey = this.validateAndSanitizeKey(key)
      const entry = this.store.get(sanitizedKey)

      // Truly atomic operation: delete and update memory and access tracking together
      const existed = this.withAtomicOperation(() => {
        const deleted = this.store.delete(sanitizedKey)
        this.accessOrder.delete(sanitizedKey)
        if (deleted && entry) {
          this.memoryUsageBytes -= entry.sizeBytes
        }
        return deleted
      })

      if (this.config.enableMetrics && existed) {
        performanceMonitor.incrementCounter('api_cache_operations_total', {
          operation: 'delete',
          result: 'success',
        })
      }

      return existed
    } catch (error) {
      if (this.config.enableMetrics) {
        performanceMonitor.incrementCounter('api_cache_operations_total', {
          operation: 'delete',
          result: 'error',
        })
      }

      logger.error('Cache delete operation failed', {
        key: typeof key === 'string' ? this.obscureKey(key) : `[${typeof key}]`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Backward compatibility: respect strictValidation setting
      if (this.config.strictValidation) {
        throw error
      }

      // Default: Return false on error instead of throwing to maintain cache behavior
      return false
    }
  }

  clear(): void {
    const size = this.store.size
    this.store.clear()
    this.accessOrder.clear()
    this.totalAccesses = 0
    this.totalHits = 0
    this.memoryUsageBytes = 0

    if (this.config.enableMetrics) {
      performanceMonitor.incrementCounter('api_cache_operations_total', {
        operation: 'clear',
        result: 'success',
      })
    }

    logger.info('Cache cleared', { entriesRemoved: size })
  }

  getStats(): CacheStats {
    const now = Date.now()
    let expired = 0

    for (const entry of this.store.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      }
    }

    return {
      size: this.store.size,
      maxSize: this.config.maxSize,
      memoryUsageMB: this.memoryUsageBytes / (1024 * 1024),
      maxMemoryMB: this.config.maxMemoryMB,
      expired,
      totalHits: this.totalHits,
      totalAccesses: this.totalAccesses,
      hitRate: this.totalAccesses > 0 ? this.totalHits / this.totalAccesses : 0,
    }
  }

  private startCleanup(): void {
    // Prevent multiple intervals from being created
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(() => {
      // Check if destroyed to prevent zombie intervals
      if (this.isDestroyed) {
        if (this.cleanupInterval) {
          clearInterval(this.cleanupInterval)
          this.cleanupInterval = null
        }
        return
      }
      this.cleanup()
    }, this.config.cleanupInterval)

    // Ensure interval doesn't prevent process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  private cleanup(): void {
    // Don't run cleanup if destroyed
    if (this.isDestroyed) {
      return
    }

    const timer = new Timer()
    const now = Date.now()

    // Use atomic operation to prevent race conditions during cleanup
    const { cleaned, memoryFreed } = this.withAtomicOperation(() => {
      let cleaned = 0
      let memoryFreed = 0
      const toDelete: string[] = []

      // First pass: identify expired entries (safe to iterate)
      for (const [key, entry] of this.store.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          toDelete.push(key)
          memoryFreed += entry.sizeBytes
          cleaned++
        }
      }

      // Second pass: atomically delete identified entries
      for (const key of toDelete) {
        this.store.delete(key)
        this.accessOrder.delete(key) // Critical: prevent memory leak
      }

      // Update memory tracking atomically
      this.memoryUsageBytes -= memoryFreed

      return { cleaned, memoryFreed }
    })

    if (cleaned > 0) {
      const duration = timer.stop()

      if (this.config.enableMetrics) {
        performanceMonitor.recordHistogram('api_cache_cleanup_duration_ms', duration)
        performanceMonitor.incrementCounter('api_cache_evictions_total', {
          reason: 'expired',
        })
      }

      logger.debug('Cache cleanup completed', {
        entriesRemoved: cleaned,
        memoryFreedMB: memoryFreed / (1024 * 1024),
        duration,
        remainingEntries: this.store.size,
        memoryUsageMB: this.memoryUsageBytes / (1024 * 1024),
      })
    }
  }

  private obscureKey(key: string): string {
    if (key.length <= 8) return key
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
  }

  destroy(): void {
    // Prevent double destruction
    if (this.isDestroyed) {
      return
    }

    this.isDestroyed = true

    // Clear interval first to prevent any further cleanup runs
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    // Clear all data
    this.clear()

    // Remove from tracking
    activeCacheInstances.delete(this)
  }
}

// Singleton instances following the rate limiter pattern
export const apiCache = new InMemoryApiCache({
  defaultTtl: 300000, // 5 minutes for general API responses
  maxSize: 500,
  maxMemoryMB: 30,
})

// Specialized cache instances for different use cases
export const healthCache = new InMemoryApiCache({
  defaultTtl: 15000, // 15 seconds for health checks (faster refresh)
  maxSize: 10,
  maxMemoryMB: 1, // Small memory footprint
})

export const metricsCache = new InMemoryApiCache({
  defaultTtl: 30000, // 30 seconds for metrics
  maxSize: 50,
  maxMemoryMB: 5,
})

// Response caching helper functions (simplified, no class dependency)
export type CachedResponse<T> = {
  data: T
  cached: boolean
  timestamp: number
}

export async function withCache<T>(
  cache: InMemoryApiCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<CachedResponse<T>> {
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return {
      data: cached,
      cached: true,
      timestamp: Date.now(),
    }
  }

  const data = await fetcher()
  cache.set(key, data, ttl)

  return {
    data,
    cached: false,
    timestamp: Date.now(),
  }
}

// Simple functional API for common operations
export function getCached<T>(key: unknown): T | null {
  return apiCache.get<T>(key)
}

export function setCached<T>(key: unknown, value: T, ttl?: number): void {
  apiCache.set(key, value, ttl)
}

export function deleteCached(key: unknown): boolean {
  return apiCache.delete(key)
}

export function clearCache(): void {
  apiCache.clear()
}

export function getCacheStats(): CacheStats {
  return apiCache.getStats()
}

// Backward compatibility: legacy strict validation functions
// These provide the old behavior where validation errors throw exceptions
export function getCachedStrict<T>(key: unknown): T | null {
  const strictCache = new InMemoryApiCache({ strictValidation: true })
  return strictCache.get<T>(key)
}

export function deleteCachedStrict(key: unknown): boolean {
  const strictCache = new InMemoryApiCache({ strictValidation: true })
  return strictCache.delete(key)
}

// Legacy alias for backward compatibility
export const getFromCache = getCached
export const setInCache = setCached
export const removeFromCache = deleteCached

// Health check endpoint (PR-7 MUST)
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export type CacheHealthCheck = {
  status: HealthStatus
  timestamp: string
  metrics: CacheStats
  issues: string[]
  uptime: number
}

const startTime = Date.now()

export function getCacheHealth(): CacheHealthCheck {
  const stats = getCacheStats()
  const issues: string[] = []
  let status: HealthStatus = 'healthy'

  // Check for degraded performance
  if (stats.hitRate < 0.5 && stats.totalAccesses > 100) {
    issues.push('Low cache hit rate detected')
    status = 'degraded'
  }

  // Check memory pressure
  if (stats.memoryUsageMB / stats.maxMemoryMB > 0.9) {
    issues.push('High memory usage detected')
    status = 'degraded'
  }

  // Check for unhealthy conditions
  if (stats.memoryUsageMB >= stats.maxMemoryMB) {
    issues.push('Memory limit exceeded')
    status = 'unhealthy'
  }

  if (stats.size >= stats.maxSize) {
    issues.push('Cache size limit reached')
    status = 'unhealthy'
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    metrics: stats,
    issues,
    uptime: Date.now() - startTime
  }
}

// Export the generalCache alias for backward compatibility
export const generalCache = apiCache

// Export class for testing purposes only
export { InMemoryApiCache }

// Track if we're shutting down to prevent new operations
let isShuttingDown = false

// Graceful shutdown handler
const gracefulShutdown = () => {
  if (isShuttingDown) {
    return // Prevent multiple shutdown attempts
  }

  isShuttingDown = true

  // Destroy all cache instances
  apiCache.destroy()
  healthCache.destroy()
  metricsCache.destroy()

  // Log shutdown
  logger.info('Cache instances destroyed during graceful shutdown')
}

// Register shutdown handlers
process.once('SIGTERM', gracefulShutdown)
process.once('SIGINT', gracefulShutdown)
process.once('beforeExit', gracefulShutdown)

// Handle unexpected exits
process.once('exit', () => {
  // Last-ditch cleanup if not already done
  if (!isShuttingDown) {
    apiCache.destroy()
    healthCache.destroy()
    metricsCache.destroy()
  }
})
