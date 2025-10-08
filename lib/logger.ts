export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export type LogContext = {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  ip?: string
  leadId?: string
  webhookUrl?: string
  [key: string]: unknown
}

type LogEntry = {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = this.isDev ? 'debug' : 'info'

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
    }

    if (context) {
      entry.context = context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDev ? error.stack : undefined,
      }
    }

    return entry
  }

  private output(entry: LogEntry): void {
    if (this.isDev) {
      // Pretty console output for development
      const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : ''
      const errorStr = entry.error?.stack || entry.error?.message || ''

      console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`)
      if (contextStr) console.log('Context:', contextStr)
      if (errorStr) console.log('Error:', errorStr)
    } else {
      // Structured JSON for production (compatible with log aggregators)
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return
    const entry = this.createLogEntry('debug', message, context)
    this.output(entry)
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return
    const entry = this.createLogEntry('info', message, context)
    this.output(entry)
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('warn')) return
    const entry = this.createLogEntry('warn', message, context, error)
    this.output(entry)
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('error')) return
    const entry = this.createLogEntry('error', message, context, error)
    this.output(entry)
  }

  // Specialized logging methods for domain-specific events
  webhookNotificationStarted(url: string, context?: LogContext): void {
    this.info('Webhook notification started', {
      ...context,
      webhookUrl: url,
    })
  }

  webhookNotificationSuccess(url: string, context?: LogContext): void {
    this.info('Webhook notification successful', {
      ...context,
      webhookUrl: url,
    })
  }

  webhookNotificationError(url: string, error: Error, context?: LogContext): void {
    this.warn(
      'Webhook notification failed',
      {
        ...context,
        webhookUrl: url,
      },
      error
    )
  }

  databaseError(operation: string, error: Error, context?: LogContext): void {
    this.error(`Database ${operation} failed`, context, error)
  }

  validationError(field: string, value: unknown, context?: LogContext): void {
    this.warn('Validation error', {
      ...context,
      field,
      invalidValue: typeof value === 'string' ? value.substring(0, 100) : typeof value,
    })
  }
}

export const logger = new Logger()
