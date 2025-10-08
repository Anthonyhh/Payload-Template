import { NextResponse } from 'next/server'
import { logger } from './logger'

export type CacheHeaders = {
  maxAge?: number
  sMaxAge?: number
  staleWhileRevalidate?: number
  staleIfError?: number
  mustRevalidate?: boolean
  noCache?: boolean
  noStore?: boolean
  public?: boolean
  private?: boolean
}

export function setCacheHeaders(response: NextResponse, options: CacheHeaders): void {
  const cacheDirectives: string[] = []

  if (options.noStore) {
    cacheDirectives.push('no-store')
  } else if (options.noCache) {
    cacheDirectives.push('no-cache')
  } else {
    if (options.public) {
      cacheDirectives.push('public')
    } else if (options.private) {
      cacheDirectives.push('private')
    }

    if (options.maxAge !== undefined) {
      cacheDirectives.push(`max-age=${options.maxAge}`)
    }

    if (options.sMaxAge !== undefined) {
      cacheDirectives.push(`s-maxage=${options.sMaxAge}`)
    }

    if (options.staleWhileRevalidate !== undefined) {
      cacheDirectives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`)
    }

    if (options.staleIfError !== undefined) {
      cacheDirectives.push(`stale-if-error=${options.staleIfError}`)
    }

    if (options.mustRevalidate) {
      cacheDirectives.push('must-revalidate')
    }
  }

  if (cacheDirectives.length > 0) {
    response.headers.set('Cache-Control', cacheDirectives.join(', '))
  }

  // Set ETag for better caching
  const etag = generateETag(response)
  if (etag) {
    response.headers.set('ETag', etag)
  }

  // Set Last-Modified header
  response.headers.set('Last-Modified', new Date().toUTCString())
}

function generateETag(response: NextResponse): string | null {
  try {
    // Simple ETag generation based on response body
    const body = response.body
    if (!body) return null

    // For JSON responses, create hash of the content
    const crypto = require('crypto')
    const hash = crypto.createHash('md5').update(JSON.stringify(body)).digest('hex')
    return `"${hash.substring(0, 16)}"`
  } catch (error) {
    logger.warn(
      'Failed to generate ETag',
      {},
      error instanceof Error ? error : new Error('Unknown ETag error')
    )
    return null
  }
}

export function handleConditionalRequests(request: Request, etag?: string): NextResponse | null {
  if (!etag) return null

  const ifNoneMatch = request.headers.get('If-None-Match')
  if (ifNoneMatch === etag) {
    logger.debug('Returning 304 Not Modified', { etag })
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=60',
      },
    })
  }

  return null
}

// Common cache configurations
export const CACHE_CONFIGS = {
  // Health checks - short cache to reduce DB load
  health: {
    maxAge: 30,
    sMaxAge: 10,
    staleWhileRevalidate: 60,
    public: true,
  },

  // Metrics - medium cache for performance data
  metrics: {
    maxAge: 60,
    sMaxAge: 30,
    staleWhileRevalidate: 300,
    public: true,
  },

  // API documentation - longer cache for static content
  docs: {
    maxAge: 3600, // 1 hour
    sMaxAge: 1800, // 30 minutes CDN
    staleWhileRevalidate: 7200, // 2 hours
    public: true,
  },

  // No cache for dynamic writes
  noCache: {
    noStore: true,
  },
} as const

export function createCachedResponse<T>(
  data: T,
  cacheConfig: CacheHeaders,
  status = 200
): NextResponse {
  const response = NextResponse.json(data, { status })
  setCacheHeaders(response, cacheConfig)
  return response
}

// Compression helper for large responses
export function shouldCompress(request: Request): boolean {
  const acceptEncoding = request.headers.get('Accept-Encoding')
  return acceptEncoding?.includes('gzip') || acceptEncoding?.includes('br') || false
}

// Response size optimization
export function optimizeResponse<T>(data: T, request: Request): T {
  // For development, include debug info
  if (process.env.NODE_ENV === 'development') {
    return data
  }

  // For production, remove debug fields and optimize
  if (typeof data === 'object' && data !== null) {
    const optimized = { ...data } as any

    // Remove debug fields in production
    delete optimized.debug
    delete optimized._internal
    delete optimized.stack

    // Compress arrays for metrics
    if ('metrics' in optimized && Array.isArray(optimized.metrics)) {
      // Only return recent metrics to reduce payload size
      optimized.metrics = optimized.metrics.slice(-100)
    }

    return optimized
  }

  return data
}
