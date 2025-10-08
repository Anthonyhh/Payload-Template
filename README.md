# FlowstateIT Website Factory (Blueprint v1.0)

Universal, production-ready blueprint for PayloadCMS + Next.js with:

- MongoDB Atlas, Cloudflare R2, useSend emails
- Vercel hosting, Cloudflare DNS/CDN/WAF
- Keyword-driven personalization (variants)
- Claude Task Master + MCP automation

## Quick start

1. `cp .env.example .env` (fill credentials)
2. `pnpm bootstrap` (interactive site bootstrap)
3. Provision via Claude Task Master MCP epics
4. Deploy to Vercel and map domain in Cloudflare

See `docs/PRD.md` for full specs.
