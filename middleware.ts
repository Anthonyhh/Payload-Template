import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, rateLimitConfigs, getRateLimitHeaders } from './lib/rate-limiter'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  addSecurityHeaders(response)

  // Apply security policies based on environment
  if (process.env.NODE_ENV === 'production') {
    addProductionSecurityHeaders(response)
  }

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = applyRateLimit(request, response)

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      )
    }
  }

  // CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    applyCorsHeaders(request, response)
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers })
  }

  return response
}

function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy for privacy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy with secure defaults
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://www.google-analytics.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "child-src 'self'",
    "manifest-src 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Permissions Policy - Restrict sensitive features
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC tracking
    'payment=(self)',
    'usb=()',
    'serial=()',
    'bluetooth=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', ')

  response.headers.set('Permissions-Policy', permissionsPolicy)

  // Prevent DNS prefetching to external domains
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  // Disable client-side caching for sensitive pages
  if (response.headers.get('Cache-Control') === null) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
}

function addProductionSecurityHeaders(response: NextResponse) {
  // HSTS - Force HTTPS in production
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // Expect-CT - Certificate Transparency
  response.headers.set('Expect-CT', 'max-age=86400, enforce')

  // Additional CSP directives for production
  const existingCSP = response.headers.get('Content-Security-Policy')
  if (existingCSP) {
    const productionCSP = existingCSP
      .replace("'unsafe-inline'", "'nonce-random' 'sha256-hash'") // Use nonces/hashes instead of unsafe-inline
      .replace("'unsafe-eval'", '') // Remove unsafe-eval in production

    response.headers.set('Content-Security-Policy', productionCSP)
  }
}

function applyRateLimit(request: NextRequest, response: NextResponse) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  // Choose appropriate rate limit config based on endpoint
  let config = rateLimitConfigs.api
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/health') || pathname.startsWith('/api/metrics')) {
    config = rateLimitConfigs.monitoring
  } else if (pathname.startsWith('/api/docs')) {
    config = rateLimitConfigs.monitoring // Documentation uses monitoring limits
  }

  // Apply stricter limits for suspicious patterns
  if (containsSuspiciousPatterns(request)) {
    config = rateLimitConfigs.strict
  }

  // Check rate limit
  const rateLimitResult = rateLimiter.check(ip, config)

  // Add rate limiting headers
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return rateLimitResult
}

function applyCorsHeaders(request: NextRequest, response: NextResponse) {
  // Allow specific origins in production, localhost in development
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? [process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']

  const origin = request.headers.get('origin')

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-API-Key'
  )
  response.headers.set(
    'Access-Control-Max-Age',
    '86400' // Cache preflight for 24 hours
  )
}

function containsSuspiciousPatterns(request: NextRequest): boolean {
  const url = request.url
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''

  // Suspicious URL patterns
  const suspiciousUrlPatterns = [
    /\.\.\//, // Directory traversal
    /%2e%2e%2f/i, // Encoded directory traversal
    /<script/i, // Script injection
    /union.*select/i, // SQL injection
    /eval\(/i, // Code injection
    /document\.cookie/i, // Cookie theft
    /javascript:/i, // JavaScript protocol
    /__proto__/i, // Prototype pollution
    /\.(php|asp|jsp|cgi)$/i, // Non-JS file extensions
  ]

  // Suspicious User-Agent patterns
  const suspiciousUAPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|httpie/i,
    /python-requests|java|go-http/i,
    /^$/, // Empty user agent
    /sqlmap|nikto|nmap|masscan/i, // Security tools
  ]

  // Check URL patterns
  if (suspiciousUrlPatterns.some((pattern) => pattern.test(url))) {
    return true
  }

  // Check User-Agent patterns (but allow legitimate bots)
  if (
    suspiciousUAPatterns.some((pattern) => pattern.test(userAgent)) &&
    !userAgent.includes('Googlebot') &&
    !userAgent.includes('Bingbot') &&
    !userAgent.includes('facebookexternalhit')
  ) {
    return true
  }

  // Check for suspicious referers
  if (
    referer &&
    (referer.includes('phishing') ||
      referer.includes('malware') ||
      referer.includes('viagra') ||
      referer.includes('casino'))
  ) {
    return true
  }

  // Check for too many different headers (potential bot)
  const headerCount = Array.from(request.headers.keys()).length
  if (headerCount > 30) {
    return true
  }

  return false
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
