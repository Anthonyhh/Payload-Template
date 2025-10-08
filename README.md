# Payload CMS + Next.js Blueprint

Universal, production-ready blueprint for Payload CMS 3.0 + Next.js 15 with:

- **Database**: MongoDB Atlas
- **Storage**: Cloudflare R2 (S3-compatible)
- **Email**: useSend integration
- **Hosting**: Vercel
- **CDN/DNS/WAF**: Cloudflare
- **Infrastructure**: Production-ready monitoring, security, logging

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- MongoDB Atlas account
- Cloudflare account (for R2 storage)

### Installation

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Fill in your credentials:
   - `MONGODB_URI` - MongoDB connection string
   - `PAYLOAD_SECRET` - Random secret for JWT (use `openssl rand -base64 32`)
   - `NEXT_PUBLIC_SERVER_URL` - Your domain (http://localhost:3000 for dev)
   - `R2_*` - Cloudflare R2 credentials
   - `USESEND_API_KEY` - useSend API key

3. **Upgrade to Next.js 15 & Payload (when ready):**
   ```bash
   pnpm add next@15 react@19 react-dom@19
   pnpm add payload @payloadcms/next @payloadcms/richtext-lexical @payloadcms/db-mongodb sharp graphql
   ```

4. **Run development server:**
   ```bash
   pnpm dev
   ```

## Project Structure

```
├── app/
│   ├── api/              # API routes (health, metrics, docs)
│   └── layout.tsx        # Root layout
├── components/
│   └── ui/               # Reusable UI components (Button, Dialog, etc.)
├── lib/                  # Shared utilities
│   ├── email.ts         # Email notification service
│   ├── sanitization.ts  # XSS protection & input sanitization
│   ├── monitoring.ts    # Performance metrics
│   ├── logger.ts        # Structured logging
│   ├── rate-limiter.ts  # API rate limiting
│   └── validations.ts   # Zod schemas
├── middleware.ts         # Security headers, CORS, rate limiting
└── public/              # Static assets
```

## 🏗️ Infrastructure Reference

### Core Utilities (`lib/`)

#### Cache System (`cache.ts` - 932 lines)
In-memory caching layer with TTL, LRU eviction, and metrics tracking.

**Features:**
- TTL-based expiration with cleanup
- LRU eviction when max size reached
- Hit/miss rate tracking
- Branded types for cache keys (type safety)
- Multiple cache instances (health, API docs, general)

**Usage:**
```typescript
import { withCache, healthCache } from '@/lib/cache'

// Cache expensive operations
const { data, cached } = await withCache(
  healthCache,
  'system-health',
  async () => {
    // Expensive operation here
    return { status: 'healthy', uptime: process.uptime() }
  },
  15000 // TTL in ms
)

console.log(`Cached: ${cached}`) // true if served from cache
```

**When to use:**
- API responses that don't change frequently
- Expensive computations
- Database query results with predictable data
- System health/status checks

#### Monitoring (`monitoring.ts` - 190 lines)
Performance metrics collection (counters, histograms, gauges).

**Features:**
- Counter metrics (incrementing values)
- Histogram metrics (value distributions)
- Gauge metrics (point-in-time values)
- Request timing utilities
- Metrics export for observability platforms

**Usage:**
```typescript
import { performanceMonitor } from '@/lib/monitoring'

// Track request counts
performanceMonitor.incrementCounter('api_requests_total', { endpoint: '/api/health' })

// Track response times
performanceMonitor.recordHistogram('request_duration_ms', 145, { method: 'GET' })

// Track current values
performanceMonitor.setGauge('active_connections', 42)

// Get all metrics
const metrics = performanceMonitor.getMetrics()
```

**When to use:**
- API endpoint performance tracking
- Database query performance
- Cache hit/miss rates
- Memory usage monitoring
- Custom business metrics

#### Logger (`logger.ts` - 144 lines)
Structured JSON logging with correlation IDs for request tracing.

**Features:**
- Log levels: debug, info, warn, error
- Structured JSON output (production)
- Pretty console output (development)
- Context injection (userId, requestId, etc.)
- Error stack traces (dev only)

**Usage:**
```typescript
import { logger } from '@/lib/logger'

// Basic logging
logger.info('User logged in', { userId: 'user_123' })
logger.warn('High memory usage', { heapUsed: 512 })
logger.error('Database connection failed', { service: 'postgres' }, error)

// Domain-specific logging
logger.webhookNotificationStarted('https://webhook.example.com', { leadId: 'lead_456' })
logger.databaseError('query', error, { table: 'users' })
logger.validationError('email', invalidEmail, { field: 'contactForm.email' })
```

**When to use:**
- API request/response logging
- Error tracking
- Audit trails
- Debugging production issues
- Performance investigation

#### Sanitization (`sanitization.ts` - 389 lines)
XSS protection, HTML tag removal, and input validation.

**Features:**
- XSS pattern detection and removal
- HTML tag sanitization
- URL validation (whitelist protocols)
- Email injection protection (CRLF, header injection)
- Unicode normalization
- Middleware for automatic sanitization

**Usage:**
```typescript
import { sanitizer } from '@/lib/sanitization'

// Sanitize user input
const cleanName = sanitizer.sanitizeString(userInput)
const cleanEmail = sanitizer.sanitizeEmail(email)
const cleanUrl = sanitizer.sanitizeUrl(url)

// Sanitize entire objects
const cleanData = sanitizer.sanitizeObject({
  name: '<script>alert("xss")</script>',
  email: 'user@example.com\r\nBcc: attacker@evil.com',
  website: 'javascript:alert(1)'
})
// Result: { name: '', email: 'user@example.com', website: '' }

// Use middleware in API routes
import { withSanitization } from '@/lib/sanitization'

export async function POST(request: NextRequest) {
  return withSanitization(request, async (sanitizedBody) => {
    // sanitizedBody is already cleaned
    return NextResponse.json({ success: true })
  })
}
```

**When to use:**
- All user input processing
- Contact forms, comment systems
- URL parameters from users
- Rich text content (before storage)
- API request validation

#### Rate Limiter (`rate-limiter.ts` - 220 lines)
Token bucket rate limiting per IP with suspicious pattern detection.

**Features:**
- Token bucket algorithm
- Per-IP rate limiting
- Multiple rate limit profiles (API, monitoring, strict)
- Suspicious pattern detection (SQL injection, XSS, bots)
- Automatic cleanup of old entries
- Rate limit headers (X-RateLimit-*)

**Usage:**
```typescript
import { rateLimiter, rateLimitConfigs } from '@/lib/rate-limiter'

// Check rate limit
const result = rateLimiter.check(ipAddress, rateLimitConfigs.api)

if (!result.allowed) {
  return new Response('Too many requests', {
    status: 429,
    headers: {
      'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000))
    }
  })
}

// Different limits for different endpoints
rateLimiter.check(ip, rateLimitConfigs.monitoring) // 300 req/min
rateLimiter.check(ip, rateLimitConfigs.api)        // 100 req/min
rateLimiter.check(ip, rateLimitConfigs.strict)     // 20 req/min
```

**When to use:**
- API route protection
- Form submission endpoints
- Authentication endpoints
- Resource-intensive operations
- Public-facing endpoints

#### Compression (`compression.ts` - 242 lines)
Brotli/Gzip response compression with content negotiation.

**Features:**
- Automatic compression algorithm selection (Brotli > Gzip)
- Accept-Encoding header parsing
- Configurable compression levels
- Minimum size threshold (1KB)
- Content-type detection
- Compression quality optimization

**Usage:**
```typescript
import { createCompressedResponse } from '@/lib/compression'

export async function GET(request: NextRequest) {
  const data = { large: 'response', with: 'lots', of: 'data' }

  // Automatically compressed based on Accept-Encoding
  return createCompressedResponse(data, request, {
    headers: { 'Cache-Control': 'public, max-age=3600' }
  })
}
```

**When to use:**
- JSON API responses > 1KB
- HTML page responses
- Large text-based responses
- Frequently accessed endpoints
- Mobile-first applications

#### Cache Middleware (`cache-middleware.ts` - 177 lines)
HTTP cache headers, ETags, and conditional request handling.

**Features:**
- ETag generation (MD5 hash)
- Conditional request handling (304 Not Modified)
- Cache-Control header configuration
- Stale-while-revalidate support
- Vary header management

**Usage:**
```typescript
import { createCachedResponse, handleConditionalRequests } from '@/lib/cache-middleware'

export async function GET(request: NextRequest) {
  // Handle 304 Not Modified
  const conditionalResponse = handleConditionalRequests(request)
  if (conditionalResponse) return conditionalResponse

  const data = { timestamp: Date.now() }

  // Response with ETag and Cache-Control
  return createCachedResponse(data, request, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  })
}
```

**When to use:**
- CDN-cached endpoints
- Static or semi-static API responses
- Resource-heavy endpoints
- Endpoints with predictable update patterns

#### Utilities (`utils.ts` - 26 lines)
Tailwind CSS class merging with conflict resolution.

**Usage:**
```typescript
import { cn } from '@/lib/utils'

// Merge classes with conflict resolution
<div className={cn('px-4 py-2', 'px-6', className)}>
  {/* Result: px-6 py-2 + custom className */}
</div>
```

#### Validations (`validations.ts` - 8 lines)
Zod schemas for form and API validation (generic foundation).

**Usage:**
```typescript
import { z } from 'zod'
import { emailSchema, urlSchema } from '@/lib/validations'

// Extend with your Payload collection schemas
const userSchema = z.object({
  email: emailSchema,
  website: urlSchema,
  name: z.string().min(2).max(100)
})

const result = userSchema.safeParse(formData)
if (!result.success) {
  console.error(result.error.errors)
}
```

### How to Use Infrastructure

#### Example 1: Create a Protected API Endpoint
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withSanitization } from '@/lib/sanitization'
import { logger } from '@/lib/logger'
import { performanceMonitor } from '@/lib/monitoring'
import { createCompressedResponse } from '@/lib/compression'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  return withSanitization(request, async (sanitizedBody) => {
    try {
      logger.info('User creation started', { email: sanitizedBody.email })

      // Your business logic here
      const user = await createUser(sanitizedBody)

      performanceMonitor.incrementCounter('users_created_total')
      performanceMonitor.recordHistogram('user_creation_duration_ms', Date.now() - startTime)

      return createCompressedResponse({ success: true, user }, request)
    } catch (error) {
      logger.error('User creation failed', { email: sanitizedBody.email }, error as Error)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
  })
}
```

#### Example 2: Cached Health Check with Monitoring
```typescript
// app/api/health/route.ts
import { NextRequest } from 'next/server'
import { withCache, healthCache } from '@/lib/cache'
import { performanceMonitor } from '@/lib/monitoring'
import { createCompressedResponse } from '@/lib/compression'
import { handleConditionalRequests } from '@/lib/cache-middleware'

export async function GET(request: NextRequest) {
  // Return 304 if content hasn't changed
  const conditionalResponse = handleConditionalRequests(request)
  if (conditionalResponse) return conditionalResponse

  const { data, cached } = await withCache(
    healthCache,
    'system-health',
    async () => ({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics: performanceMonitor.getMetrics().length
    }),
    15000 // 15 second cache
  )

  return createCompressedResponse(data, request, {
    headers: { 'Cache-Control': 'public, max-age=15' }
  })
}
```

#### Example 3: Form Submission with Full Security Stack
```typescript
// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withSanitization, sanitizer } from '@/lib/sanitization'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { emailSchema } from '@/lib/validations'

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  message: z.string().min(10).max(5000)
})

export async function POST(request: NextRequest) {
  return withSanitization(request, async (sanitizedBody) => {
    // Validate after sanitization
    const validation = contactSchema.safeParse(sanitizedBody)

    if (!validation.success) {
      logger.validationError('contact_form', sanitizedBody, {
        errors: validation.error.errors
      })
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, email, message } = validation.data

    logger.info('Contact form submitted', { email })

    // Process contact form
    // ...

    return NextResponse.json({ success: true })
  })
}
```

### When to Use What

| Scenario | Use These Tools |
|----------|----------------|
| **Public API endpoint** | rate-limiter + sanitization + logger + compression |
| **Database-heavy endpoint** | cache + monitoring + logger |
| **Form submission** | sanitization + validations + logger |
| **Static/semi-static data** | cache + cache-middleware + compression |
| **Resource-intensive operation** | monitoring + cache + logger |
| **User-generated content** | sanitization (MUST) + validations |
| **Health/status checks** | cache + compression + monitoring |
| **High-traffic endpoint** | cache + compression + rate-limiter |

### Security Checklist

- [ ] All user input sanitized (`sanitization.ts`)
- [ ] Input validated with Zod schemas (`validations.ts`)
- [ ] Rate limiting applied to public endpoints (`rate-limiter.ts`)
- [ ] Security headers configured (`middleware.ts`)
- [ ] No sensitive data in logs (`logger.ts`)
- [ ] CORS properly configured (`middleware.ts`)
- [ ] Environment variables secured (`.env.example`)

### Performance Checklist

- [ ] Responses > 1KB compressed (`compression.ts`)
- [ ] Expensive operations cached (`cache.ts`)
- [ ] HTTP cache headers set (`cache-middleware.ts`)
- [ ] Metrics collected for key operations (`monitoring.ts`)
- [ ] Database queries optimized (connection pooling ready)
- [ ] Static assets served from CDN
- [ ] Images optimized (Next.js Image component)

### Monitoring in Production

1. **View metrics:** `GET /api/metrics` (returns all collected metrics)
2. **Check health:** `GET /api/health` (system status + cache stats)
3. **Export logs:** Structured JSON format ready for log aggregators (Datadog, New Relic, etc.)
4. **Track performance:** All metrics include timestamps and labels for filtering

## Infrastructure Features

### Security
- ✅ XSS protection & input sanitization
- ✅ CSRF protection
- ✅ Rate limiting with suspicious pattern detection
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Environment-specific policies

### Monitoring
- ✅ Structured logging with correlation IDs
- ✅ Performance monitoring & metrics
- ✅ Health check endpoints
- ✅ Request tracing

### Database
- ✅ Connection pooling ready
- ✅ Health checks
- ✅ Query optimization patterns

## Payload CMS Integration (Next Steps)

1. **Create `payload.config.ts`** at root
2. **Convert `next.config.cjs`** to ESM with `withPayload()`
3. **Add Payload admin routes** in `app/(payload)/`
4. **Define Collections** (Pages, Posts, Media, etc.)
5. **Configure storage adapter** for Cloudflare R2

See [Payload Documentation](https://payloadcms.com/docs) for details.

## Development

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm typecheck    # Run TypeScript checks
pnpm lint         # Run ESLint
pnpm test         # Run tests
pnpm format       # Format code with Prettier
```

## Deployment

### Vercel
1. Connect your Git repository
2. Configure environment variables
3. Deploy

### Environment Variables
Ensure all production values are set:
- MongoDB URI with production credentials
- Cloudflare R2 production bucket
- useSend production API key
- `NEXT_PUBLIC_SERVER_URL` with your domain

## License

MIT
