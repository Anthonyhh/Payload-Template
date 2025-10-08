import { NextRequest } from 'next/server'
import { performanceMonitor } from '@/lib/monitoring'
import { metricsCache, withCache } from '@/lib/cache'
import { CACHE_CONFIGS, handleConditionalRequests } from '@/lib/cache-middleware'
import { createCompressedResponse, estimateCompressionBenefit } from '@/lib/compression'

export async function GET(request: NextRequest) {
  try {
    // Handle conditional requests (304 Not Modified)
    const conditionalResponse = handleConditionalRequests(request)
    if (conditionalResponse) {
      return conditionalResponse
    }

    const { data: metricsData, cached } = await withCache(
      metricsCache,
      'performance-metrics',
      async () => {
        const metrics = performanceMonitor.getMetrics()

        // Optimize metrics for production (limit size)
        const optimizedMetrics =
          process.env.NODE_ENV === 'production'
            ? metrics.slice(-200) // Only recent metrics in production
            : metrics

        return {
          metrics: optimizedMetrics,
          timestamp: new Date().toISOString(),
          count: optimizedMetrics.length,
          totalCount: metrics.length,
          summary: generateMetricsSummary(optimizedMetrics),
        }
      },
      30000 // Cache for 30 seconds
    )

    // Add cache information to response
    const responseData = {
      ...metricsData,
      cache: {
        cached,
        stats: metricsCache.getStats(),
      },
    }

    // Estimate compression benefit for metrics endpoint
    const compressionEstimate = estimateCompressionBenefit(JSON.stringify(responseData))

    return createCompressedResponse(responseData, request, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_CONFIGS.metrics.maxAge}, s-maxage=${CACHE_CONFIGS.metrics.sMaxAge}, stale-while-revalidate=${CACHE_CONFIGS.metrics.staleWhileRevalidate}`,
        'X-Compression-Estimate': `${Math.round((1 - compressionEstimate.estimatedBrotliSize / compressionEstimate.originalSize) * 100)}%`,
      },
      compression: {
        threshold: 512, // Compress smaller responses for metrics
        level: 7, // Higher compression for metrics data
      },
    })
  } catch (error) {
    return createCompressedResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        cache: { cached: false },
      },
      request,
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}

function generateMetricsSummary(metrics: any[]): Record<string, any> {
  const summary: Record<string, any> = {
    totalMetrics: metrics.length,
    types: {},
    recentActivity: {},
  }

  // Count metrics by type
  for (const metric of metrics) {
    const type = metric.type || 'unknown'
    summary.types[type] = (summary.types[type] || 0) + 1
  }

  // Recent activity (last 5 minutes)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  const recentMetrics = metrics.filter(
    (m) => m.timestamp && new Date(m.timestamp).getTime() > fiveMinutesAgo
  )

  summary.recentActivity = {
    count: recentMetrics.length,
    types: {},
  }

  for (const metric of recentMetrics) {
    const type = metric.type || 'unknown'
    summary.recentActivity.types[type] = (summary.recentActivity.types[type] || 0) + 1
  }

  return summary
}
