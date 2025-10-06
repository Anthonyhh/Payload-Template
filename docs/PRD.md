# FlowstateIT Website Factory — Master PRD (v1.0)

## Mission
Create a reusable, automated, secure blueprint to launch keyword-personalized PayloadCMS sites on Railway+Cloudflare+MongoDB+R2+useSend, orchestrated by Claude Task Master and MCPs.

## Pre-Requisites
- GitHub repo access
- Railway account & API token
- MongoDB Atlas or Railway Mongo (connection string)
- Cloudflare account, API token, Zone ID
- Cloudflare R2 credentials
- useSend API key
- Node 20+, pnpm/corepack, Docker
- Editor with MCP (Claude Code / Cursor)
- Claude Task Master configured as MCP:
```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-…",
        "OPENAI_API_KEY": "sk-…",
        "PERPLEXITY_API_KEY": "pplx-…"
      }
    }
  }
}
```

## Objectives & KPIs
- Auto-deploy site in < 15 min; 99.9% uptime
- Keyword personalization accuracy ≥ 95%
- p95 latency < 400ms for personalized pages
- A on securityheaders.com; Lighthouse SEO ≥ 95

## Architecture
- CMS: Payload + MongoDB adapter
- Frontend: Next.js (App Router, SSR)
- Personalization: kw cookie via middleware; variant resolver
- Storage: Cloudflare R2
- Email: useSend (SDK or adapter)
- Hosting: Railway (Docker)
- Edge: Cloudflare (DNS/CDN/WAF/Cache)
- Automation: Claude Task Master (MCPs: Cloudflare/Railway/MongoDB)
- Observability: pino logs, minimal OTEL later

## Functional Requirements

### Collections
- LandingPages: slug, title, baseBlocks
- Variants: landingPage, keyword, patterns[], priority, active, targetPaths[], overrideBlocks
- (Optional) Keywords: value, patterns[], priority

### Middleware
- Detect kw / utm_term / referrer → set kw cookie (Max-Age 3600)
- Skip /admin, /api, /_next

### Variant selection
- Exact → Pattern → Parent → Default
- Merge overrideBlocks into baseBlocks

### Email
- useSend templates; events/logging; include kw metadata

### Storage
- R2 via S3 API credentials

### Security
- CSP/HSTS/XFO/Referrer/Permissions headers; rate limit forms

### SEO
- Canonical tags; default variant for bots; sitemap for landings

### Edge Cache
- Bypass /admin/* and /api/*; cache /_next/static/*; optionally vary by kw on main landings

### CI/CD
- GitHub Actions: lint, typecheck, unit/int, build, scan, deploy, health check

### Testing
- Unit (variant), Integration (Payload/Mongo), E2E (Playwright), Load (k6), SEO (Lighthouse), Security (ZAP)

## Deliverables
- Working admin at /admin
- Personalized landing pages with kw cookie
- R2 uploads; useSend emails
- Cloudflare DNS + cache rules
- CI green; health route 200
- Docs/runbooks

## Success Definition
- Spin-up per site < 15 min
- Personalization verified for top 20 keywords
- Security + SEO thresholds met
- Reusable across brands via /config/*.json and bootstrap script
