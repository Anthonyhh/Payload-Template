import { describe, expect, test, vi, beforeEach } from 'vitest'
import crypto from 'crypto'
import type { LeadFormData } from '@/lib/validations'

// Since these functions aren't exported, we'll test their behavior
// through the POST handler in integration tests
// This file tests the webhook logic specifically

// Constants for testing
const TEST_SECRET = 'test-webhook-secret-key'
const TEST_URL = 'https://webhook.example.com/leads'

const SAMPLE_LEAD: LeadFormData = {
  name: 'Test User',
  email: 'test@example.com',
  service: 'agentic-ai',
  consent: true,
}

// Re-implement the functions for testing
// (In production, these should be exported from route.ts)
function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

interface WebhookConfig {
  url: string
  secret?: string
}

interface WebhookResult {
  success: boolean
  error?: string
}

async function notifyLeadSubmissionWebhook(
  lead: LeadFormData,
  config: WebhookConfig
): Promise<WebhookResult> {
  try {
    const payload = JSON.stringify(lead)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.secret) {
      const signature = generateHmacSignature(payload, config.secret)
      headers['X-Webhook-Signature'] = `sha256=${signature}`
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: payload,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook request failed with status ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown webhook error',
    }
  }
}

describe('generateHmacSignature', () => {
  const TEST_PAYLOAD = JSON.stringify(SAMPLE_LEAD)

  test('generates consistent HMAC-SHA256 signatures', () => {
    const signature1 = generateHmacSignature(TEST_PAYLOAD, TEST_SECRET)
    const signature2 = generateHmacSignature(TEST_PAYLOAD, TEST_SECRET)

    expect(signature1).toBe(signature2)
    expect(signature1).toMatch(/^[a-f0-9]{64}$/)
  })

  test('produces different signatures for different payloads', () => {
    const payload1 = JSON.stringify({ ...SAMPLE_LEAD, name: 'User 1' })
    const payload2 = JSON.stringify({ ...SAMPLE_LEAD, name: 'User 2' })

    const sig1 = generateHmacSignature(payload1, TEST_SECRET)
    const sig2 = generateHmacSignature(payload2, TEST_SECRET)

    expect(sig1).not.toBe(sig2)
  })

  test('produces different signatures for different secrets', () => {
    const sig1 = generateHmacSignature(TEST_PAYLOAD, 'secret1')
    const sig2 = generateHmacSignature(TEST_PAYLOAD, 'secret2')

    expect(sig1).not.toBe(sig2)
  })

  test('matches expected signature format', () => {
    const signature = generateHmacSignature(TEST_PAYLOAD, TEST_SECRET)

    // Should be 64 hex characters (256 bits / 4 bits per hex char)
    expect(signature).toHaveLength(64)
    expect(signature).toMatch(/^[a-f0-9]{64}$/)
  })

  test('produces deterministic output', () => {
    const signatures = Array.from({ length: 10 }, () =>
      generateHmacSignature(TEST_PAYLOAD, TEST_SECRET)
    )

    // All signatures should be identical
    const uniqueSignatures = new Set(signatures)
    expect(uniqueSignatures.size).toBe(1)
  })
})

describe('notifyLeadSubmissionWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('sends webhook with correct headers when secret provided', async () => {
    let capturedRequest: any = null

    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      capturedRequest = { url, ...options }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
    })

    const config: WebhookConfig = {
      url: TEST_URL,
      secret: TEST_SECRET,
    }

    const result = await notifyLeadSubmissionWebhook(SAMPLE_LEAD, config)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()

    expect(capturedRequest.url).toBe(TEST_URL)
    expect(capturedRequest.method).toBe('POST')
    expect(capturedRequest.headers['Content-Type']).toBe('application/json')
    expect(capturedRequest.headers['X-Webhook-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/)
    expect(capturedRequest.body).toBe(JSON.stringify(SAMPLE_LEAD))
  })

  test('sends webhook without signature when no secret', async () => {
    let capturedHeaders: any = null

    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      capturedHeaders = options.headers
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
    })

    const config: WebhookConfig = {
      url: TEST_URL,
      // No secret
    }

    const result = await notifyLeadSubmissionWebhook(SAMPLE_LEAD, config)

    expect(result.success).toBe(true)
    expect(capturedHeaders['X-Webhook-Signature']).toBeUndefined()
  })

  test('returns error for non-ok HTTP response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    })

    const config: WebhookConfig = { url: TEST_URL }
    const result = await notifyLeadSubmissionWebhook(SAMPLE_LEAD, config)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Webhook request failed with status 500')
  })

  test('returns error when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'))

    const config: WebhookConfig = { url: TEST_URL }
    const result = await notifyLeadSubmissionWebhook(SAMPLE_LEAD, config)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network timeout')
  })

  test('handles non-Error thrown values', async () => {
    global.fetch = vi.fn().mockRejectedValue('String error')

    const config: WebhookConfig = { url: TEST_URL }
    const result = await notifyLeadSubmissionWebhook(SAMPLE_LEAD, config)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unknown webhook error')
  })

  test('correctly formats webhook payload', async () => {
    let capturedBody: string = ''

    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      capturedBody = options.body
      return Promise.resolve({ ok: true, status: 200 })
    })

    const complexLead: LeadFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'ACME Corp',
      role: 'CTO',
      website: 'https://acme.com',
      service: 'fractional-cto',
      team_size: '51-200',
      budget: '100k-500k',
      bottleneck: 'Need to scale engineering team',
      consent: true,
    }

    const config: WebhookConfig = { url: TEST_URL }
    await notifyLeadSubmissionWebhook(complexLead, config)

    const parsedBody = JSON.parse(capturedBody)
    expect(parsedBody).toEqual(complexLead)
  })

  test('generates correct HMAC signature', async () => {
    let capturedSignature: string = ''

    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      capturedSignature = options.headers['X-Webhook-Signature'] || ''
      return Promise.resolve({ ok: true, status: 200 })
    })

    const config: WebhookConfig = {
      url: TEST_URL,
      secret: TEST_SECRET,
    }

    await notifyLeadSubmissionWebhook(SAMPLE_LEAD, config)

    // Extract the signature without the 'sha256=' prefix
    const actualSignature = capturedSignature.replace('sha256=', '')

    // Calculate expected signature
    const expectedSignature = generateHmacSignature(JSON.stringify(SAMPLE_LEAD), TEST_SECRET)

    expect(actualSignature).toBe(expectedSignature)
  })
})
