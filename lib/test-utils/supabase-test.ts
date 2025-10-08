import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { vi } from 'vitest'

// Test storage implementation to avoid GoTrueClient conflicts
class TestStorage implements Storage {
  private store: Record<string, string> = {}

  get length(): number {
    return Object.keys(this.store).length
  }

  clear(): void {
    this.store = {}
  }

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] || null
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }
}

// Singleton test client to avoid multiple GoTrueClient instances
let testClient: SupabaseClient | null = null
let testStorageInstance: TestStorage | null = null

export function createTestSupabaseClient(): SupabaseClient {
  if (testClient) {
    return testClient
  }

  // Create a unique storage instance for tests
  if (!testStorageInstance) {
    testStorageInstance = new TestStorage()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'

  testClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storage: testStorageInstance,
      storageKey: `sb-test-${Date.now()}-${Math.random().toString(36)}`,
    },
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
    global: {
      headers: {
        'x-application': 'flowstateit-test',
      },
    },
  })

  return testClient
}

export function resetTestSupabaseClient(): void {
  testClient = null
  testStorageInstance = null
}

// Mock factory for consistent test clients
export const createMockSupabaseClient = vi.fn(() => {
  const mockClient = {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'mock-id-123' },
            error: null,
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
  }

  return mockClient
})
