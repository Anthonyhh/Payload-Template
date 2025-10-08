import nodemailer from 'nodemailer'
import { logger } from './logger'
import { performanceMonitor, Timer } from './monitoring'

export type EmailConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export type EmailTemplate = {
  subject: string
  html: string
  text?: string
}

export type EmailNotification = {
  to: string | string[]
  template: EmailTemplate
  data?: Record<string, any>
}

type EmailResult = {
  success: boolean
  messageId?: string
  error?: string
}

class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null
  private config: EmailConfig | null = null

  initialize(config: EmailConfig): void {
    this.config = config

    const transportOptions = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    }

    this.transporter = nodemailer.createTransport(transportOptions)

    logger.info('Email service initialized', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
    })
  }

  async sendEmail(notification: EmailNotification): Promise<EmailResult> {
    if (!this.transporter || !this.config) {
      const error = 'Email service not initialized'
      logger.error('Email send failed - not initialized')
      return { success: false, error }
    }

    const timer = new Timer()
    const emailId = Math.random().toString(36).substring(7)

    try {
      const recipients = Array.isArray(notification.to) ? notification.to : [notification.to]

      logger.debug('Sending email', {
        emailId,
        recipients: recipients.length,
        subject: notification.template.subject,
      })

      const mailOptions = {
        from: this.config.from,
        to: notification.to,
        subject: this.replaceTemplateVariables(notification.template.subject, notification.data),
        html: this.replaceTemplateVariables(notification.template.html, notification.data),
        text: notification.template.text
          ? this.replaceTemplateVariables(notification.template.text, notification.data)
          : undefined,
      }

      const info = await this.transporter.sendMail(mailOptions)
      const duration = timer.stop()

      performanceMonitor.recordHistogram('email_send_duration_ms', duration)
      performanceMonitor.incrementCounter('emails_sent_total', { status: 'success' })

      logger.info('Email sent successfully', {
        emailId,
        messageId: info.messageId,
        recipients: recipients.length,
        duration,
      })

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      const duration = timer.stop()

      performanceMonitor.recordHistogram('email_send_duration_ms', duration)
      performanceMonitor.incrementCounter('emails_sent_total', { status: 'error' })

      logger.error(
        'Email send failed',
        { emailId, duration },
        error instanceof Error ? error : new Error('Unknown email error')
      )

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      }
    }
  }

  private replaceTemplateVariables(template: string, data?: Record<string, any>): string {
    if (!data) return template

    let result = template
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      result = result.replace(placeholder, String(value))
    }

    return result
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Cannot test email connection - service not initialized')
      return false
    }

    try {
      await this.transporter.verify()
      logger.info('Email connection test successful')
      return true
    } catch (error) {
      logger.error(
        'Email connection test failed',
        {},
        error instanceof Error ? error : new Error('Connection test failed')
      )
      return false
    }
  }
}

export const emailService = new EmailNotificationService()

export function createEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  if (!host || !port || !user || !pass || !from) {
    logger.warn('Email configuration incomplete', {
      hasHost: !!host,
      hasPort: !!port,
      hasUser: !!user,
      hasPass: !!pass,
      hasFrom: !!from,
    })
    return null
  }

  return {
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
    user,
    pass,
    from,
  }
}

export const leadNotificationTemplates = {
  newLead: {
    subject: 'New Lead Submission - {{service}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Lead Submission
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="margin-top: 0; color: #495057;">Lead Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Name:</td>
              <td style="padding: 8px 0;">{{name}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Email:</td>
              <td style="padding: 8px 0;">{{email}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Service:</td>
              <td style="padding: 8px 0;">{{service}}</td>
            </tr>
            {{#if company}}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Company:</td>
              <td style="padding: 8px 0;">{{company}}</td>
            </tr>
            {{/if}}
            {{#if role}}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Role:</td>
              <td style="padding: 8px 0;">{{role}}</td>
            </tr>
            {{/if}}
            {{#if website}}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Website:</td>
              <td style="padding: 8px 0;"><a href="{{website}}" style="color: #007bff;">{{website}}</a></td>
            </tr>
            {{/if}}
            {{#if team_size}}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Team Size:</td>
              <td style="padding: 8px 0;">{{team_size}}</td>
            </tr>
            {{/if}}
            {{#if budget}}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Budget:</td>
              <td style="padding: 8px 0;">{{budget}}</td>
            </tr>
            {{/if}}
          </table>
          
          {{#if bottleneck}}
          <div style="margin-top: 20px;">
            <h4 style="color: #495057; margin-bottom: 10px;">Business Challenge:</h4>
            <div style="background-color: white; padding: 15px; border-radius: 4px; border: 1px solid #dee2e6;">
              {{bottleneck}}
            </div>
          </div>
          {{/if}}
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #e9ecef; border-radius: 4px;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            <strong>Submission Time:</strong> {{submissionTime}}<br>
            <strong>Lead ID:</strong> {{leadId}}
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <a href="https://flowstateit.co.uk/admin" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View in Dashboard
          </a>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px;">
          <p>This email was automatically generated by FlowstateIt Lead Management System</p>
        </div>
      </div>
    `,
    text: `
New Lead Submission - {{service}}

Lead Details:
- Name: {{name}}
- Email: {{email}}
- Service: {{service}}
- Company: {{company}}
- Role: {{role}}
- Website: {{website}}
- Team Size: {{team_size}}
- Budget: {{budget}}

Business Challenge:
{{bottleneck}}

Submission Time: {{submissionTime}}
Lead ID: {{leadId}}

Visit https://flowstateit.co.uk/admin to view in dashboard.
    `,
  },

  leadAlert: {
    subject: 'High-Priority Lead Alert - {{service}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">⚡ High-Priority Lead Alert</h2>
        </div>
        
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #721c24;">Priority Lead Submission</h3>
          <p style="margin-bottom: 0; color: #721c24;">
            This lead submission matches your high-priority criteria and requires immediate attention.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Lead Summary</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li style="padding: 5px 0;"><strong>Name:</strong> {{name}}</li>
            <li style="padding: 5px 0;"><strong>Email:</strong> {{email}}</li>
            <li style="padding: 5px 0;"><strong>Service:</strong> {{service}}</li>
            <li style="padding: 5px 0;"><strong>Budget:</strong> {{budget}}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://flowstateit.co.uk/admin/leads/{{leadId}}" 
             style="display: inline-block; padding: 15px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
            RESPOND NOW
          </a>
        </div>
      </div>
    `,
    text: `
HIGH-PRIORITY LEAD ALERT - {{service}}

This lead submission requires immediate attention:

- Name: {{name}}
- Email: {{email}}
- Service: {{service}}
- Budget: {{budget}}

View details: https://flowstateit.co.uk/admin/leads/{{leadId}}

RESPOND IMMEDIATELY to maximize conversion potential.
    `,
  },
}

export async function initializeEmailService(): Promise<boolean> {
  const config = createEmailConfig()

  if (!config) {
    logger.info('Email service not configured - notifications disabled')
    return false
  }

  emailService.initialize(config)

  const connectionTest = await emailService.testConnection()
  if (!connectionTest) {
    logger.warn('Email service connection test failed - notifications may not work')
    return false
  }

  logger.info('Email service successfully initialized and tested')
  return true
}
