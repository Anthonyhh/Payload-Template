import { logger } from './logger'

export type MetricType = 'counter' | 'histogram' | 'gauge'

export type Metric = {
  name: string
  type: MetricType
  value: number
  labels?: Record<string, string>
  timestamp?: string
}

export type PerformanceMetrics = {
  responseTime: number
  requestCount: number
  errorCount: number
  databaseQueryTime?: number
  webhookResponseTime?: number
}

class PerformanceMonitor {
  private metrics: Map<string, Metric> = new Map()

  recordMetric(metric: Metric): void {
    const key = `${metric.name}_${JSON.stringify(metric.labels || {})}`
    this.metrics.set(key, {
      ...metric,
      timestamp: metric.timestamp || new Date().toISOString(),
    })

    // Log metric for external monitoring systems
    logger.info('Performance metric recorded', {
      metric: metric.name,
      value: metric.value,
      type: metric.type,
      labels: metric.labels,
    })
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const key = `${name}_${JSON.stringify(labels || {})}`
    const existing = this.metrics.get(key)
    const value = existing?.value || 0

    this.recordMetric({
      name,
      type: 'counter',
      value: value + 1,
      labels,
    })
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric({
      name,
      type: 'histogram',
      value,
      labels,
    })
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric({
      name,
      type: 'gauge',
      value,
      labels,
    })
  }

  getMetrics(): Metric[] {
    return Array.from(this.metrics.values())
  }

  clearMetrics(): void {
    this.metrics.clear()
  }

  // Specialized methods for common application metrics
  recordApiRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): void {
    this.incrementCounter('api_requests_total', {
      endpoint,
      method,
      status: statusCode.toString(),
    })

    this.recordHistogram('api_response_time_ms', responseTime, {
      endpoint,
      method,
    })

    if (statusCode >= 400) {
      this.incrementCounter('api_errors_total', {
        endpoint,
        method,
        status: statusCode.toString(),
      })
    }
  }

  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    this.incrementCounter('database_queries_total', {
      operation,
      table,
      result: success ? 'success' : 'error',
    })

    this.recordHistogram('database_query_duration_ms', duration, {
      operation,
      table,
    })
  }

  recordWebhookCall(url: string, success: boolean, responseTime: number): void {
    this.incrementCounter('webhook_calls_total', {
      host: new URL(url).hostname,
      result: success ? 'success' : 'error',
    })

    this.recordHistogram('webhook_response_time_ms', responseTime, {
      host: new URL(url).hostname,
    })
  }

  recordLeadSubmission(service: string, success: boolean): void {
    this.incrementCounter('lead_submissions_total', {
      service,
      result: success ? 'success' : 'error',
    })
  }

  recordValidationError(field: string): void {
    this.incrementCounter('validation_errors_total', {
      field,
    })
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Performance timing utilities
export class Timer {
  private startTime: number

  constructor() {
    this.startTime = performance.now()
  }

  elapsed(): number {
    return performance.now() - this.startTime
  }

  stop(): number {
    const elapsed = this.elapsed()
    return elapsed
  }
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      heapUsed: Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100, // MB
      heapTotal: Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100, // MB
      external: Math.round((usage.external / 1024 / 1024) * 100) / 100, // MB
      rss: Math.round((usage.rss / 1024 / 1024) * 100) / 100, // MB
    }
  }
  return null
}

// System health check
export function getHealthStatus() {
  const memory = getMemoryUsage()
  const uptime = typeof process !== 'undefined' ? process.uptime() : null

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptime ? Math.floor(uptime) : null,
    memory,
    metrics: performanceMonitor.getMetrics().length,
  }
}
