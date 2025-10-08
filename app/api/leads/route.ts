import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { leadFormSchema, type LeadFormData } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { performanceMonitor, Timer } from '@/lib/monitoring'
// import { withDbConnection, optimizedQuery } from '@/lib/db'
import { emailService, leadNotificationTemplates } from '@/lib/email'
import { dataSanitizer, leadFormSanitizationSchema } from '@/lib/sanitization'
import { duplicateDetector } from '@/lib/duplicate-detection'
import { createCompressedResponse } from '@/lib/compression'

export async function POST(request: NextRequest) {
  const requestTimer = new Timer()
  const requestId = crypto.randomUUID()
  const context = {
    requestId,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
  }

  let body: unknown = null
  let statusCode = 200
  let leadService = 'unknown'

  try {
    body = await request.json()

    // Extract service for metrics before validation
    if (typeof body === 'object' && body && 'service' in body) {
      leadService = String(body.service)
    }

    logger.leadSubmissionStarted(body as Record<string, any>, context)

    // First sanitize the raw input data
    const sanitizationTimer = new Timer()
    const sanitizedData = dataSanitizer.sanitizeObject(
      body as Record<string, any>,
      leadFormSanitizationSchema
    ) as Partial<LeadFormData>
    const sanitizationDuration = sanitizationTimer.stop()

    performanceMonitor.recordHistogram('data_sanitization_duration_ms', sanitizationDuration)
    logger.debug('Data sanitization completed', {
      ...context,
      duration: sanitizationDuration,
      fieldsProcessed: Object.keys(sanitizedData).length,
    })

    // Then validate the sanitized data
    const validatedLead = leadFormSchema.parse(sanitizedData)
    leadService = validatedLead.service

    // Check for duplicates
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      undefined

    const duplicateCheck = await duplicateDetector.checkDuplicate(validatedLead, clientIP)

    if (duplicateCheck.isDuplicate) {
      statusCode = 429
      logger.warn('Duplicate lead submission blocked', {
        ...context,
        duplicateHash: duplicateCheck.hash.substring(0, 8),
        submissionCount: duplicateCheck.submissionCount,
        timeWindow: duplicateCheck.timeWindow,
        reason: duplicateCheck.reason,
      })

      performanceMonitor.incrementCounter('lead_submissions_total', {
        service: leadService,
        result: 'duplicate',
      })

      return createCompressedResponse(
        {
          error: 'Duplicate submission detected',
          message: `Please wait ${Math.round(duplicateCheck.timeWindow / 1000 / 60)} minutes before submitting again`,
          retryAfter: Math.ceil(duplicateCheck.timeWindow / 1000),
          submissionCount: duplicateCheck.submissionCount,
        },
        request,
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Retry-After': Math.ceil(duplicateCheck.timeWindow / 1000).toString(),
          },
        }
      )
    }

    // Persist via Payload REST API
    const payloadApiUrl = process.env.PAYLOAD_API_URL
    const payloadApiToken = process.env.PAYLOAD_API_TOKEN

    if (!payloadApiUrl || !payloadApiToken) {
      statusCode = 500
      performanceMonitor.recordLeadSubmission(leadService, false)
      logger.error('Payload API not configured', { hasUrl: !!payloadApiUrl, hasToken: !!payloadApiToken })
      return createCompressedResponse({ error: 'Backend not configured' }, request, { status: 500 })
    }

    const apiTimer = new Timer()
    const resp = await fetch(`${payloadApiUrl.replace(/\/$/, '')}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${payloadApiToken}`,
      },
      body: JSON.stringify(validatedLead),
      // Payload is the authoritative backend; prevent any caches
      cache: 'no-store',
    })
    const apiDuration = apiTimer.stop()

    if (!resp.ok) {
      statusCode = 500
      performanceMonitor.recordLeadSubmission(leadService, false)
      logger.error('Payload lead create failed', { status: resp.status, duration: apiDuration })
      return createCompressedResponse({ error: 'Failed to save lead' }, request, { status: 500 })
    }

    const payloadResult = await resp.json().catch(() => ({} as any))
    type LeadWithId = LeadFormData & { id: string; created_at?: string }
    const leadData = (payloadResult?.doc || payloadResult?.data || payloadResult) as LeadWithId
    logger.leadSubmissionSuccess(leadData.id, { ...context, leadId: leadData.id })
    performanceMonitor.recordLeadSubmission(leadService, true)

    // Send email notification if configured
    await sendLeadNotificationEmail(leadData, { ...context, leadId: leadData.id })

    // Notify external systems via webhook if configured
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (leadData && webhookUrl) {
      const webhookConfig: WebhookConfig = {
        url: webhookUrl,
        secret: process.env.WEBHOOK_SECRET,
      }

      logger.webhookNotificationStarted(webhookUrl, { ...context, leadId: leadData.id })

      const webhookTimer = new Timer()
      const webhookResult = await notifyLeadSubmissionWebhook(leadData, webhookConfig)
      const webhookDuration = webhookTimer.stop()

      performanceMonitor.recordWebhookCall(webhookUrl, webhookResult.success, webhookDuration)

      if (!webhookResult.success) {
        logger.webhookNotificationError(
          webhookUrl,
          new Error(webhookResult.error || 'Unknown webhook error'),
          { ...context, leadId: leadData.id }
        )
        // Continue - webhook failure shouldn't fail lead submission
      } else {
        logger.webhookNotificationSuccess(webhookUrl, { ...context, leadId: leadData.id })
      }
    }

    return createCompressedResponse({ data: leadData, error: null }, request, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Lead submissions shouldn't be cached
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      statusCode = 400
      logger.validationError('lead_form', body, context)
      performanceMonitor.recordValidationError('lead_form')
      performanceMonitor.recordLeadSubmission(leadService, false)
    } else {
      statusCode = 400
      logger.leadSubmissionError(
        error instanceof Error ? error : new Error('Unknown error'),
        context
      )
      performanceMonitor.recordLeadSubmission(leadService, false)
    }
    return createCompressedResponse({ error: 'Invalid request' }, request, { status: 400 })
  } finally {
    // Record overall API performance
    const totalDuration = requestTimer.stop()
    performanceMonitor.recordApiRequest('/api/leads', 'POST', statusCode, totalDuration)
  }
}

interface WebhookConfig {
  url: string
  secret?: string
}

interface WebhookResult {
  success: boolean
  error?: string
}

/**
 * Generates HMAC-SHA256 signature for webhook payload authentication
 */
function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Notifies external systems about new lead submissions via secure webhook
 * Uses HMAC-SHA256 for payload authentication when secret is provided
 */
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

async function sendLeadNotificationEmail(
  lead: LeadFormData & { id: string; created_at?: string },
  context: { requestId: string; leadId: string }
): Promise<void> {
  try {
    const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL
    if (!notificationEmail) {
      logger.debug('Lead notification email not configured', context)
      return
    }

    const isHighPriority = isHighPriorityLead(lead)
    const template = isHighPriority
      ? leadNotificationTemplates.leadAlert
      : leadNotificationTemplates.newLead

    const templateData = {
      ...lead,
      leadId: lead.id,
      submissionTime: lead.created_at
        ? new Date(lead.created_at).toLocaleString('en-GB', {
            timeZone: 'Europe/London',
            dateStyle: 'full',
            timeStyle: 'short',
          })
        : new Date().toLocaleString('en-GB', {
            timeZone: 'Europe/London',
            dateStyle: 'full',
            timeStyle: 'short',
          }),
    }

    logger.debug('Sending lead notification email', {
      ...context,
      recipient: notificationEmail.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
      isHighPriority,
      service: lead.service,
    })

    const emailTimer = new Timer()
    const result = await emailService.sendEmail({
      to: notificationEmail,
      template,
      data: templateData,
    })
    const emailDuration = emailTimer.stop()

    if (result.success) {
      logger.info('Lead notification email sent', {
        ...context,
        messageId: result.messageId,
        isHighPriority,
        duration: emailDuration,
      })

      performanceMonitor.incrementCounter('lead_notifications_sent_total', {
        type: isHighPriority ? 'alert' : 'standard',
        service: lead.service,
        status: 'success',
      })
    } else {
      logger.warn('Lead notification email failed', {
        ...context,
        error: result.error,
        isHighPriority,
        duration: emailDuration,
      })

      performanceMonitor.incrementCounter('lead_notifications_sent_total', {
        type: isHighPriority ? 'alert' : 'standard',
        service: lead.service,
        status: 'error',
      })
    }
  } catch (error) {
    logger.error(
      'Lead notification email error',
      context,
      error instanceof Error ? error : new Error('Email notification error')
    )

    performanceMonitor.incrementCounter('lead_notifications_sent_total', {
      type: 'unknown',
      service: lead.service || 'unknown',
      status: 'error',
    })
  }
}

function isHighPriorityLead(lead: LeadFormData): boolean {
  // High priority criteria:
  // 1. Budget is 100k+
  // 2. Service is 'fractional-cto' or 'fractional-caio'
  // 3. Team size is 201+ employees

  const highBudgetTiers = ['100k-500k', '500k+']
  const executiveServices = ['fractional-cto', 'fractional-caio']
  const largeTenantSizes = ['201-500', '500+']

  return (
    Boolean(lead.budget && highBudgetTiers.includes(lead.budget)) ||
    Boolean(executiveServices.includes(lead.service)) ||
    Boolean(lead.team_size && largeTenantSizes.includes(lead.team_size))
  )
}
