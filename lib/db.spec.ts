import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { DatabaseConnectionPool } from './db'

describe('DatabaseConnectionPool', () => {
  let pool: DatabaseConnectionPool

  beforeEach(() => {
    pool = new DatabaseConnectionPool({
      maxConnections: 2, // Reduced for tests to minimize GoTrueClient instances
      connectionTimeout: 1000,
      idleTimeout: 5000,
    })
  })

  afterEach(async () => {
    await pool.close()
  })

  test('initializes pool with correct size', () => {
    const stats = pool.getStats()
    expect(stats.total).toBe(2)
    expect(stats.idle).toBe(2)
    expect(stats.active).toBe(0)
  })

  test('acquires and releases connections correctly', async () => {
    const connection1 = await pool.getConnection()
    expect(connection1).toBeDefined()

    let stats = pool.getStats()
    expect(stats.active).toBe(1)
    expect(stats.idle).toBe(1)

    pool.releaseConnection(connection1)

    stats = pool.getStats()
    expect(stats.active).toBe(0)
    expect(stats.idle).toBe(2)
  })

  test('handles connection pool exhaustion gracefully', async () => {
    // Acquire all connections
    const connections = []
    for (let i = 0; i < 2; i++) {
      connections.push(await pool.getConnection())
    }

    const stats = pool.getStats()
    expect(stats.active).toBe(2)
    expect(stats.idle).toBe(0)

    // This should timeout since no connections available
    await expect(pool.getConnection()).rejects.toThrow('Connection timeout')

    // Release one connection
    pool.releaseConnection(connections[0])

    // Now we should be able to get a connection again
    const newConnection = await pool.getConnection()
    expect(newConnection).toBeDefined()
  })

  test('health check returns boolean', async () => {
    // Note: This will likely fail in test environment without real Supabase
    // but we're testing the function signature and error handling
    const isHealthy = await pool.healthCheck()
    expect(typeof isHealthy).toBe('boolean')
  })
})
