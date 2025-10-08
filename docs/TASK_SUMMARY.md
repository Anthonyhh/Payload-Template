# FlowstateIT Website Factory - Complete Task Breakdown

## Overview

**Total Tasks:** 80+ across 7 EPICs
**Current Status:** EPIC-00 Complete (7/7 tasks), Ready for EPIC-01

---

## EPIC-00: Project Initialization ✅ COMPLETED

**Status:** 7/7 tasks complete
**Completion:** 2025-01-06

### Completed Tasks:

1. ✅ Scaffold repository structure
2. ✅ Add environment templates (.env.example)
3. ✅ Baseline README and PRD
4. ✅ Create task-master.json with EPICs
5. ✅ Write bootstrap CLI script
6. ✅ Setup GitHub Actions CI workflow
7. ✅ Install task-master-ai globally

---

## EPIC-01: Infrastructure Provisioning (via MCPs)

**Status:** 0/9 tasks
**Priority:** HIGH
**Blocking:** Must complete before EPIC-02

### Tasks:

1. ⏳ Setup Cloudflare Account & API
2. ⏳ Provision Cloudflare R2 Bucket
3. ⏳ Create Cloudflare DNS Records
4. ⏳ Setup Vercel Account
5. ⏳ Link Vercel Project to GitHub
6. ⏳ Setup MongoDB Atlas
7. ⏳ Setup useSend Email Service
8. ⏳ Create and populate .env file
9. ⏳ Verify all infrastructure is reachable

**Estimated Time:** 2-3 hours
**Deliverables:**

- Working Cloudflare DNS + R2
- Vercel deployment URL
- MongoDB connection string
- Populated .env file

---

## EPIC-02: Core App — Payload + Next + Email + Storage

**Status:** 0/13 tasks
**Dependencies:** EPIC-01

### Tasks:

1. ⏳ Install PayloadCMS dependencies
2. ⏳ Create Payload config file
3. ⏳ Configure MongoDB adapter
4. ⏳ Add Cloudflare R2 storage plugin
5. ⏳ Create base Payload collections (LandingPages, Variants, Keywords, Media)
6. ⏳ Setup Next.js integration
7. ⏳ Integrate useSend email service
8. ⏳ Create email templates
9. ⏳ Create health check endpoint
10. ⏳ Add TypeScript config
11. ⏳ Test Payload admin login
12. ⏳ Test R2 media upload
13. ⏳ Test email sending

**Estimated Time:** 4-6 hours
**Deliverables:**

- Working /admin at https://cms.yourdomain.com/admin
- Media uploads to R2
- Email notifications via useSend
- Health check endpoint returning 200

---

## EPIC-03: Keyword Personalization Engine

**Status:** 0/10 tasks
**Dependencies:** EPIC-02

### Tasks:

1. ⏳ Add indexes to Variants collection
2. ⏳ Create Next.js middleware for keyword detection
3. ⏳ Create variant resolver utility
4. ⏳ Implement variant selection logic (Exact → Pattern → Parent → Default)
5. ⏳ Create block merging function
6. ⏳ Create API route for variant resolution
7. ⏳ Add bot detection for SEO safety
8. ⏳ Create landing page template component
9. ⏳ Add unit tests for variant resolver
10. ⏳ Test keyword personalization end-to-end

**Estimated Time:** 3-4 hours
**Deliverables:**

- Middleware sets kw cookie
- Variant selection works (95%+ accuracy)
- Bots see default variant
- Cookie persists for 1 hour

---

## EPIC-04: Security, SEO, Caching, and WAF

**Status:** 0/9 tasks
**Dependencies:** EPIC-03

### Tasks:

1. ⏳ Add security headers middleware (CSP, HSTS, XFO, Referrer)
2. ⏳ Configure Cloudflare cache rules
3. ⏳ Add canonical tags to landing pages
4. ⏳ Create XML sitemap
5. ⏳ Add robots.txt
6. ⏳ Add rate limiting to form submissions
7. ⏳ Configure Cloudflare WAF
8. ⏳ Test security headers (A grade on securityheaders.com)
9. ⏳ Run Lighthouse SEO audit (≥ 95 score)

**Estimated Time:** 2-3 hours
**Deliverables:**

- Security headers: A grade
- SEO score: ≥ 95
- Cloudflare WAF active
- Edge caching configured

---

## EPIC-05: Observability & CI/CD

**Status:** 0/6 tasks
**Dependencies:** EPIC-02

### Tasks:

1. ⏳ Add structured logging with pino
2. ⏳ Add request tracing (correlation IDs)
3. ⏳ Setup GitHub Actions workflow (lint/test/build)
4. ⏳ Add deployment health check
5. ⏳ Setup error monitoring (optional - Sentry)
6. ⏳ Add performance monitoring (Web Vitals)

**Estimated Time:** 2-3 hours
**Deliverables:**

- CI pipeline green
- Structured JSON logs in production
- Automated health checks post-deploy

---

## EPIC-06: Bootstrap CLI & Reusability

**Status:** 1/5 tasks (bootstrap script created)
**Dependencies:** EPIC-01, EPIC-02, EPIC-03, EPIC-05

### Tasks:

1. ✅ Bootstrap CLI script (completed in EPIC-00)
2. ⏳ Enhance bootstrap CLI with validation
3. ⏳ Add multi-site config management
4. ⏳ Create upgrade script
5. ⏳ Add template propagation
6. ⏳ Test bootstrap with real site (< 15 min target)

**Estimated Time:** 2-3 hours
**Deliverables:**

- New site deploys in < 15 minutes
- Multi-site support from one repo
- Upgrade path for existing sites

---

## EPIC-07: End-to-End Smoke & Hardening

**Status:** 0/10 tasks
**Dependencies:** EPIC-04, EPIC-05, EPIC-06

### Tasks:

1. ⏳ Setup Playwright E2E tests
2. ⏳ Write E2E test: Admin login flow
3. ⏳ Write E2E test: Keyword personalization
4. ⏳ Setup k6 load testing (p95 < 400ms)
5. ⏳ Run security scan with OWASP ZAP
6. ⏳ Run Lighthouse CI
7. ⏳ Create deployment runbook
8. ⏳ Create operator guide
9. ⏳ Final integration test
10. ⏳ Project sign-off

**Estimated Time:** 4-5 hours
**Deliverables:**

- All E2E tests passing
- Load test: p95 < 400ms
- Security scan: clean
- Complete documentation
- Production-ready system

---

## Summary

### Progress

- **Completed:** 8 / 80+ tasks (10%)
- **Current Phase:** Infrastructure Provisioning
- **Estimated Total Time:** 20-25 hours

### Critical Path

1. **EPIC-01** (Infrastructure) → 2-3 hours
2. **EPIC-02** (Core App) → 4-6 hours
3. **EPIC-03** (Personalization) → 3-4 hours
4. **EPIC-04** (Security/SEO) → 2-3 hours
5. **EPIC-05** (CI/CD) → 2-3 hours
6. **EPIC-06** (Reusability) → 2-3 hours
7. **EPIC-07** (Testing/Docs) → 4-5 hours

### Next Immediate Actions

1. Create accounts: Vercel, Cloudflare, MongoDB Atlas, useSend
2. Obtain API tokens and credentials
3. Run `cp .env.example .env` and fill credentials
4. Execute EPIC-01 tasks 201-209

### Success Criteria

- [ ] 99.9% uptime
- [ ] < 15 min deployment per site
- [ ] ≥ 95% keyword personalization accuracy
- [ ] p95 latency < 400ms
- [ ] A grade security headers
- [ ] ≥ 95 Lighthouse SEO score

---

## Detailed Task List

See `tasks/detailed-tasks.json` for complete breakdown with steps, test strategies, and file specifications.
