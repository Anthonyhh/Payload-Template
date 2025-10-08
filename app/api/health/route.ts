import { NextRequest } from 'next/server'
import { performanceMonitor } from '@/lib/monitoring'
import { healthCache, withCache } from '@/lib/cache'
import {
  createCachedResponse,
  CACHE_CONFIGS,
  handleConditionalRequests,
} from '@/lib/cache-middleware'
import { createCompressedResponse } from '@/lib/compression'

export async function GET(request: NextRequest) {
  try {
    // Handle conditional requests (304 Not Modified)
    const conditionalResponse = handleConditionalRequests(request)
    if (conditionalResponse) {
      return conditionalResponse
    }

    const { data: healthData, cached } = await withCache(
      healthCache,
      'system-health',
      async (): Promise<{
        status: string
        timestamp: string
        uptime: number
        memory: {
          heapUsed: number
          heapTotal: number
          external: number
          rss: number
        }
        metrics: number
        cache: {
          cached: boolean
          stats: any
        }
      }> => {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: {
            heapUsed: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            heapTotal: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
            external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
            rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
          },
          metrics: performanceMonitor.getMetrics().length,
          cache: {
            cached: false, // Will be overridden by withCache
            stats: healthCache.getStats(),
          },
        }
      },
      15000 // Cache for 15 seconds
    )

    return createCompressedResponse(healthData, request, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_CONFIGS.health.maxAge}, s-maxage=${CACHE_CONFIGS.health.sMaxAge}, stale-while-revalidate=${CACHE_CONFIGS.health.staleWhileRevalidate}`,
      },
    })
  } catch (error) {
    return createCompressedResponse(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        cache: { cached: false },
      },
      request,
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}
