import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { logger } from './logger'
import { withDbConnection } from './db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

// Check if Supabase is properly configured
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your-supabase-url' &&
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))

// Create client only if properly configured, otherwise create a mock client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: isTest ? `sb-test-main-${Date.now()}` : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: isTest ? 1 : 5,
        },
      },
      global: {
        headers: {
          'x-application': isTest ? 'flowstateit-test' : 'flowstateit-client',
        },
      },
    })
  : ({
      // Mock client for when Supabase is not configured
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () =>
          Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        update: () =>
          Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () =>
          Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      }),
      auth: {
        signInWithPassword: () =>
          Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    } as any)

export const isClientConfigured = isSupabaseConfigured

// Branded types for better type safety (CLAUDE.md C-5)
export type LeadId = z.infer<typeof LeadIdSchema>
const LeadIdSchema = z.string().brand<'LeadId'>()

export type Lead = {
  id?: LeadId
  created_at?: string
  name: string
  email: string
  company?: string
  role?: string
  website?: string
  service: string
  team_size?: string
  budget?: string
  bottleneck?: string
  consent: boolean
  score?: number
  enriched?: boolean
  meta?: Record<string, any>
}

export type LeadSubmissionError = {
  message: string
  status?: number
  details?: unknown
}

export async function submitLead(
  lead: Omit<Lead, 'id' | 'created_at'>
): Promise<{ data: Lead | null; error: LeadSubmissionError | null }> {
  const sessionId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36)
  const context = {
    sessionId,
    service: lead.service,
    hasEmail: !!lead.email,
    hasCompany: !!lead.company,
  }

  try {
    logger.debug('Client lead submission started', context)

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    logger.info('Client lead submission successful', {
      ...context,
      leadId: result.data?.id,
    })

    return { data: result.data, error: null }
  } catch (error) {
    logger.error(
      'Client lead submission failed',
      context,
      error instanceof Error ? error : new Error('Unknown error')
    )

    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status:
          error instanceof Error && error.message.includes('status:')
            ? parseInt(error.message.split('status: ')[1])
            : undefined,
        details: error,
      },
    }
  }
}
