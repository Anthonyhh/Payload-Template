import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'
import { performanceMonitor, Timer } from './monitoring'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your-supabase-url' &&
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))

export const isDbAvailable = isSupabaseConfigured

type ConnectionPoolConfig = {
  maxConnections: number
  idleTimeout: number
  connectionTimeout: number
  retryAttempts: number
  retryDelay: number
}

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

const defaultPoolConfig: ConnectionPoolConfig = {
  maxConnections: isTest ? 3 : 10, // Reduced pool size for tests
  idleTimeout: isTest ? 5000 : 60000,
  connectionTimeout: isTest ? 5000 : 30000,
  retryAttempts: 3,
  retryDelay: 1000,
}

export class DatabaseConnectionPool {
  private pool: SupabaseClient[] = []
  private activeConnections = new Set<SupabaseClient>()
  private config: ConnectionPoolConfig

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...defaultPoolConfig, ...config }
    this.initializePool()
  }

  private initializePool(): void {
    if (!isSupabaseConfigured) {
      logger.warn('Supabase not configured - database operations will be disabled', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlValue: supabaseUrl?.substring(0, 20) + '...',
      })
      return
    }

    for (let i = 0; i < this.config.maxConnections; i++) {
      const client = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storageKey: isTest ? `sb-test-pool-${Date.now()}-${i}` : undefined,
        },
        realtime: {
          params: {
            eventsPerSecond: isTest ? 1 : 10,
          },
        },
        global: {
          headers: {
            'x-connection-pool-id': `conn-${i}`,
            'x-application': isTest ? 'flowstateit-test' : 'flowstateit',
          },
        },
      })
      this.pool.push(client)
    }

    logger.info('Database connection pool initialized', {
      maxConnections: this.config.maxConnections,
      poolSize: this.pool.length,
    })
  }

  async getConnection(): Promise<SupabaseClient> {
    if (!isSupabaseConfigured) {
      throw new Error('Database not configured - Supabase environment variables missing')
    }

    const timer = new Timer()

    try {
      let connection = this.pool.pop()

      if (!connection) {
        if (this.activeConnections.size >= this.config.maxConnections) {
          await this.waitForConnection()
          connection = this.pool.pop()
        }

        if (!connection) {
          throw new Error('Unable to acquire database connection from pool')
        }
      }

      this.activeConnections.add(connection)

      performanceMonitor.incrementCounter('db_connections_acquired_total')
      performanceMonitor.recordHistogram('db_connection_acquire_time_ms', timer.stop())

      return connection
    } catch (error) {
      logger.error(
        'Failed to acquire database connection',
        {},
        error instanceof Error ? error : new Error('Unknown connection error')
      )
      performanceMonitor.incrementCounter('db_connection_errors_total', { type: 'acquire' })
      throw error
    }
  }

  releaseConnection(connection: SupabaseClient): void {
    if (this.activeConnections.has(connection)) {
      this.activeConnections.delete(connection)
      this.pool.push(connection)
      performanceMonitor.incrementCounter('db_connections_released_total')
    }
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout: no connections available'))
      }, this.config.connectionTimeout)

      const checkInterval = setInterval(() => {
        if (this.pool.length > 0) {
          clearTimeout(timeout)
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }

  getStats(): { active: number; idle: number; total: number } {
    return {
      active: this.activeConnections.size,
      idle: this.pool.length,
      total: this.config.maxConnections,
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!isSupabaseConfigured) {
      logger.debug('Database health check skipped - Supabase not configured')
      return false
    }

    const timer = new Timer()

    try {
      const connection = await this.getConnection()

      const { data, error } = await connection.from('leads').select('id').limit(1)

      this.releaseConnection(connection)

      if (error) {
        logger.warn('Database health check failed', { error: error.message })
        return false
      }

      const duration = timer.stop()
      performanceMonitor.recordHistogram('db_health_check_duration_ms', duration)

      return true
    } catch (error) {
      logger.error(
        'Database health check error',
        {},
        error instanceof Error ? error : new Error('Health check failed')
      )
      return false
    }
  }

  async close(): Promise<void> {
    this.pool.length = 0
    this.activeConnections.clear()
    logger.info('Database connection pool closed')
  }
}

export const dbConnectionPool = new DatabaseConnectionPool()

export async function withDbConnection<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const connection = await dbConnectionPool.getConnection()
  const timer = new Timer()

  try {
    const result = await operation(connection)
    performanceMonitor.recordHistogram('db_operation_duration_ms', timer.stop())
    return result
  } catch (error) {
    performanceMonitor.incrementCounter('db_operation_errors_total')
    throw error
  } finally {
    dbConnectionPool.releaseConnection(connection)
  }
}

export async function optimizedQuery<T>(
  client: SupabaseClient,
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  queryBuilder: any
): Promise<{ data: T | null; error: any }> {
  const timer = new Timer()
  const queryId = Math.random().toString(36).substring(7)

  logger.debug('Database query started', {
    queryId,
    table: tableName,
    operation,
  })

  try {
    const result = await queryBuilder
    const duration = timer.stop()

    performanceMonitor.recordDatabaseQuery(operation, tableName, duration, !result.error)
    performanceMonitor.recordHistogram('db_query_duration_ms', duration, {
      table: tableName,
      operation,
    })

    if (result.error) {
      logger.error(
        'Database query failed',
        {
          queryId,
          table: tableName,
          operation,
          duration,
        },
        new Error(result.error.message)
      )

      performanceMonitor.incrementCounter('db_query_errors_total', {
        table: tableName,
        operation,
        error: result.error.code || 'unknown',
      })
    } else {
      logger.debug('Database query completed', {
        queryId,
        table: tableName,
        operation,
        duration,
        recordCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
      })
    }

    return result
  } catch (error) {
    const duration = timer.stop()
    performanceMonitor.recordDatabaseQuery(operation, tableName, duration, false)

    logger.error(
      'Database query exception',
      {
        queryId,
        table: tableName,
        operation,
        duration,
      },
      error instanceof Error ? error : new Error('Query exception')
    )

    throw error
  }
}

export async function batchInsert<T>(
  client: SupabaseClient,
  tableName: string,
  records: T[],
  batchSize = 100
): Promise<{ success: number; failed: number; errors: any[] }> {
  const timer = new Timer()
  let success = 0
  let failed = 0
  const errors: any[] = []

  logger.info('Batch insert started', {
    table: tableName,
    totalRecords: records.length,
    batchSize,
  })

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    try {
      const { data, error } = await optimizedQuery(
        client,
        tableName,
        'insert',
        client.from(tableName).insert(batch)
      )

      if (error) {
        failed += batch.length
        errors.push(error)
      } else {
        success += batch.length
      }
    } catch (error) {
      failed += batch.length
      errors.push(error)
    }
  }

  const duration = timer.stop()

  logger.info('Batch insert completed', {
    table: tableName,
    totalRecords: records.length,
    success,
    failed,
    duration,
    errorCount: errors.length,
  })

  performanceMonitor.recordHistogram('db_batch_insert_duration_ms', duration, {
    table: tableName,
  })

  performanceMonitor.incrementCounter('db_batch_operations_total', {
    table: tableName,
    operation: 'insert',
    status: errors.length === 0 ? 'success' : 'partial',
  })

  return { success, failed, errors }
}

export { dbConnectionPool as connectionPool }
export type { ConnectionPoolConfig }
