import { logger } from './logger'
import { performanceMonitor } from './monitoring'

export type SanitizationConfig = {
  maxStringLength: number
  allowedHtmlTags: string[]
  allowedUrlProtocols: string[]
  preventXssAttacks: boolean
  validateEmailFormat: boolean
}

const defaultConfig: SanitizationConfig = {
  maxStringLength: 1000,
  allowedHtmlTags: [], // No HTML tags allowed by default
  allowedUrlProtocols: ['https', 'http'],
  preventXssAttacks: true,
  validateEmailFormat: true,
}

export class DataSanitizer {
  private config: SanitizationConfig

  constructor(config: Partial<SanitizationConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  sanitizeString(value: unknown, fieldName: string = 'unknown'): string {
    if (typeof value !== 'string') {
      throw new Error(`Field ${fieldName}: Expected string, got ${typeof value}`)
    }

    let sanitized = value

    // Trim whitespace
    sanitized = sanitized.trim()

    // Check length limits
    if (sanitized.length > this.config.maxStringLength) {
      logger.warn('String length exceeded limit', {
        fieldName,
        originalLength: sanitized.length,
        maxLength: this.config.maxStringLength,
      })

      performanceMonitor.incrementCounter('sanitization_warnings_total', {
        type: 'length_exceeded',
        field: fieldName,
      })

      sanitized = sanitized.substring(0, this.config.maxStringLength)
    }

    // XSS prevention
    if (this.config.preventXssAttacks) {
      sanitized = this.removeXssPatterns(sanitized, fieldName)
    }

    // HTML tag removal (unless specifically allowed)
    if (this.config.allowedHtmlTags.length === 0) {
      sanitized = this.removeHtmlTags(sanitized, fieldName)
    } else {
      sanitized = this.sanitizeHtmlTags(sanitized, fieldName)
    }

    return sanitized
  }

  sanitizeEmail(value: unknown, fieldName: string = 'email'): string {
    const sanitized = this.sanitizeString(value, fieldName)

    if (this.config.validateEmailFormat && !this.isValidEmail(sanitized)) {
      throw new Error(`Field ${fieldName}: Invalid email format`)
    }

    // Additional email-specific sanitization
    const emailSanitized = sanitized.toLowerCase()

    // Check for common email injection patterns
    if (this.containsEmailInjectionPatterns(emailSanitized)) {
      logger.warn('Email injection attempt detected', {
        fieldName,
        sanitizedEmail: this.obscureEmail(emailSanitized),
      })

      performanceMonitor.incrementCounter('sanitization_blocks_total', {
        type: 'email_injection',
        field: fieldName,
      })

      throw new Error(`Field ${fieldName}: Invalid email format`)
    }

    return emailSanitized
  }

  sanitizeUrl(value: unknown, fieldName: string = 'url'): string {
    // For URLs, we only do basic string sanitization without XSS pattern removal
    // since we'll validate the protocol and URL structure properly below
    if (typeof value !== 'string') {
      throw new Error(`Field ${fieldName}: Expected string, got ${typeof value}`)
    }

    let sanitized = value.trim()

    // Check length limits
    if (sanitized.length > this.config.maxStringLength) {
      logger.warn('String length exceeded limit', {
        fieldName,
        originalLength: sanitized.length,
        maxLength: this.config.maxStringLength,
      })

      performanceMonitor.incrementCounter('sanitization_warnings_total', {
        type: 'length_exceeded',
        field: fieldName,
      })

      sanitized = sanitized.substring(0, this.config.maxStringLength)
    }

    // Skip XSS pattern removal for URLs - we'll validate the protocol properly

    try {
      const url = new URL(sanitized)

      // Check protocol
      if (!this.config.allowedUrlProtocols.includes(url.protocol.replace(':', ''))) {
        throw new Error(`Field ${fieldName}: Protocol ${url.protocol} not allowed`)
      }

      // Check for suspicious patterns
      if (this.containsSuspiciousUrlPatterns(url.href)) {
        logger.warn('Suspicious URL pattern detected', {
          fieldName,
          domain: url.hostname,
        })

        performanceMonitor.incrementCounter('sanitization_warnings_total', {
          type: 'suspicious_url',
          field: fieldName,
        })
      }

      // Return normalized URL - preserve original format unless pathname is just '/'
      let normalizedUrl = url.href

      // Only remove trailing slash if it was added by URL constructor for root paths
      if (normalizedUrl.endsWith('/') && url.pathname === '/' && !sanitized.endsWith('/')) {
        normalizedUrl = normalizedUrl.slice(0, -1)
      }
      return normalizedUrl
    } catch (error) {
      if (error instanceof Error && error.message.includes('Protocol')) {
        throw error // Re-throw protocol errors with original message
      }
      throw new Error(`Field ${fieldName}: Invalid URL format`)
    }
  }

  sanitizeObject<T extends Record<string, any>>(
    obj: T,
    schema: Record<
      keyof T,
      | 'string'
      | 'email'
      | 'url'
      | 'number'
      | 'boolean'
      | 'optional_string'
      | 'optional_email'
      | 'optional_url'
    >
  ): Partial<T> {
    const sanitized: Partial<T> = {}

    for (const [key, type] of Object.entries(schema) as [keyof T, string][]) {
      const fieldName = String(key)

      if (this.shouldSkipField(obj[key], type, fieldName)) {
        continue
      }

      try {
        sanitized[key] = this.sanitizeFieldValue(obj[key], type, fieldName)
        this.recordSanitizationSuccess(type, fieldName)
      } catch (error) {
        this.recordSanitizationError(type, fieldName, error)
        throw error
      }
    }

    return sanitized
  }

  private shouldSkipField(value: unknown, type: string, fieldName: string): boolean {
    if (type.startsWith('optional_') && (value === undefined || value === null)) {
      return true
    }

    if (type.startsWith('optional_') && value === '') {
      throw new Error(`Field ${fieldName}: Empty string not allowed`)
    }

    return false
  }

  private sanitizeFieldValue<T>(value: unknown, type: string, fieldName: string): T {
    const baseType = type.replace('optional_', '')

    switch (baseType) {
      case 'string':
        return this.sanitizeString(value, fieldName) as T
      case 'email':
        return this.sanitizeEmail(value, fieldName) as T
      case 'url':
        return this.sanitizeUrl(value, fieldName) as T
      case 'number':
        return this.validateNumber(value, fieldName) as T
      case 'boolean':
        return this.validateBoolean(value, fieldName) as T
      default:
        logger.warn('Unknown sanitization type', { fieldName, type })
        throw new Error(`Unknown sanitization type: ${type}`)
    }
  }

  private validateNumber(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || !isFinite(value)) {
      throw new Error(`Field ${fieldName}: Expected finite number`)
    }
    return value
  }

  private validateBoolean(value: unknown, fieldName: string): boolean {
    if (typeof value !== 'boolean') {
      throw new Error(`Field ${fieldName}: Expected boolean`)
    }
    return value
  }

  private recordSanitizationSuccess(type: string, fieldName: string): void {
    performanceMonitor.incrementCounter('sanitization_operations_total', {
      type: type.replace('optional_', ''),
      field: fieldName,
      status: 'success',
    })
  }

  private recordSanitizationError(type: string, fieldName: string, error: unknown): void {
    performanceMonitor.incrementCounter('sanitization_operations_total', {
      type: type.replace('optional_', ''),
      field: fieldName,
      status: 'error',
    })

    logger.error(
      'Sanitization failed',
      { fieldName, type },
      error instanceof Error ? error : new Error('Unknown sanitization error')
    )
  }

  private removeXssPatterns(value: string, fieldName: string): string {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /expression\(/gi,
    ]

    let sanitized = value
    let blocked = false

    for (const pattern of xssPatterns) {
      if (pattern.test(sanitized)) {
        blocked = true
        sanitized = sanitized.replace(pattern, '')
      }
    }

    if (blocked) {
      logger.warn('XSS patterns removed', { fieldName })
      performanceMonitor.incrementCounter('sanitization_blocks_total', {
        type: 'xss_pattern',
        field: fieldName,
      })
    }

    return sanitized
  }

  private removeHtmlTags(value: string, fieldName: string): string {
    const hasHtml = /<\/?[a-z][^>]*>/i.test(value)

    if (hasHtml) {
      logger.debug('HTML tags removed', { fieldName })
      performanceMonitor.incrementCounter('sanitization_operations_total', {
        type: 'html_removal',
        field: fieldName,
        status: 'success',
      })
    }

    return value.replace(/<\/?[a-z][^>]*>/gi, '')
  }

  private sanitizeHtmlTags(value: string, fieldName: string): string {
    // This is a simple implementation - in production, consider using a library like DOMPurify
    const allowedTagsRegex = new RegExp(
      `<(?!\/?(${this.config.allowedHtmlTags.join('|')})\\b)[^>]*>`,
      'gi'
    )

    const sanitized = value.replace(allowedTagsRegex, '')

    if (sanitized !== value) {
      logger.debug('Disallowed HTML tags removed', { fieldName })
      performanceMonitor.incrementCounter('sanitization_operations_total', {
        type: 'html_sanitization',
        field: fieldName,
        status: 'success',
      })
    }

    return sanitized
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private containsEmailInjectionPatterns(email: string): boolean {
    const injectionPatterns = [
      /\r|\n/, // CRLF injection
      /cc:/i, // CC injection
      /bcc:/i, // BCC injection
      /to:/i, // TO injection
      /subject:/i, // Subject injection
      /content-type:/i, // Content-Type injection
      /%0a|%0d/i, // URL encoded CRLF
    ]

    return injectionPatterns.some((pattern) => pattern.test(email))
  }

  private containsSuspiciousUrlPatterns(url: string): boolean {
    const suspiciousPatterns = [
      /\b(?:eval|alert|confirm|prompt)\s*\(/i,
      /javascript:/i,
      /data:text\/html/i,
      /\.tk$|\.ml$|\.ga$|\.cf$/i, // Suspicious TLDs
      /\b(?:bit\.ly|tinyurl|t\.co|goo\.gl)\/\w+/i, // URL shorteners
      /[^\w\.-]/g, // Non-standard characters (beyond basic URL chars)
    ]

    return suspiciousPatterns.some((pattern) => pattern.test(url))
  }

  private obscureEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (local.length <= 2) return `${local}***@${domain}`
    return `${local.substring(0, 2)}***@${domain}`
  }
}

// Default sanitizer instance
export const dataSanitizer = new DataSanitizer()

// Predefined sanitization schemas
export const leadFormSanitizationSchema = {
  name: 'string' as const,
  email: 'email' as const,
  company: 'optional_string' as const,
  role: 'optional_string' as const,
  website: 'optional_url' as const,
  service: 'string' as const,
  team_size: 'optional_string' as const,
  budget: 'optional_string' as const,
  bottleneck: 'optional_string' as const,
  consent: 'boolean' as const,
}
