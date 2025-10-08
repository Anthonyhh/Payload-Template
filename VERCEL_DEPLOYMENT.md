# Vercel Deployment Guide

## Current Status
- ✅ Migrated from Railway to Vercel (commit: c364228)
- ✅ Vercel configuration created (`vercel.json`)
- ✅ Environment variables template ready

## Prerequisites
1. Vercel CLI installed: `pnpm add -g vercel`
2. Vercel account with GitHub connected
3. All environment variables from `.env` ready

## Quick Deploy

### Option 1: Vercel CLI (Fastest)
```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration (Recommended for CI/CD)
1. Go to https://vercel.com/new
2. Import this GitHub repository
3. Configure environment variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `PAYLOAD_SECRET` - Generated secret (from .env)
   - `NEXT_PUBLIC_SERVER_URL` - Your Vercel domain (e.g., https://your-app.vercel.app)
   - `R2_BUCKET` - Cloudflare R2 bucket name
   - `R2_ACCOUNT_ID` - Cloudflare account ID
   - `R2_ACCESS_KEY_ID` - R2 access key
   - `R2_SECRET_ACCESS_KEY` - R2 secret key
   - `R2_ENDPOINT` - R2 endpoint URL
   - `CLOUDFLARE_API_TOKEN` - (optional) For programmatic access
   - `USESEND_API_KEY` - useSend API key
   - `KEYWORD_PERSONALIZATION` - Set to "1"
   - `SECURITY_HEADERS` - Set to "1"

4. Click **Deploy**

## Environment Variables Setup

You can also set environment variables via CLI:
```bash
vercel env add MONGODB_URI
vercel env add PAYLOAD_SECRET
vercel env add NEXT_PUBLIC_SERVER_URL
vercel env add R2_BUCKET
vercel env add R2_ACCOUNT_ID
vercel env add R2_ACCESS_KEY_ID
vercel env add R2_SECRET_ACCESS_KEY
vercel env add R2_ENDPOINT
vercel env add USESEND_API_KEY
```

## Custom Domain Setup (Cloudflare DNS)

After deploying to Vercel:

1. Get your Vercel deployment URL (e.g., `your-app.vercel.app`)
2. In Cloudflare DNS, add CNAME record:
   - **Type**: CNAME
   - **Name**: `cms` (or your subdomain)
   - **Target**: `cname.vercel-dns.com`
   - **Proxy status**: DNS only (gray cloud) initially
   - **TTL**: Auto

3. In Vercel dashboard:
   - Go to Settings > Domains
   - Add your custom domain (e.g., `cms.yourdomain.com`)
   - Vercel will verify DNS

4. After verification, you can enable Cloudflare proxy (orange cloud)

## Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0` (or Vercel IPs)
- [ ] R2 bucket is accessible and configured
- [ ] `NEXT_PUBLIC_SERVER_URL` matches your production domain
- [ ] Custom domain configured in both Vercel and Cloudflare
- [ ] Health check endpoint works: `curl https://your-domain.com/api/health`
- [ ] Admin panel accessible: `https://your-domain.com/admin`

## Current Deployment Info

Based on commit history, the project was migrated from Railway to Vercel.

**Previous Setup**: Railway
**Current Setup**: Vercel
**Migration Date**: Based on commit c364228

## Post-Deployment

After successful deployment:
1. Visit `https://your-domain.com/admin`
2. Create your first admin user
3. Start adding Landing Pages and Variants
4. Test keyword personalization: `https://your-domain.com/?kw=test-keyword`

## Troubleshooting

**Build fails**: Check Node.js version is ≥20.10.0
**500 errors**: Verify all environment variables are set
**MongoDB connection fails**: Check IP whitelist in MongoDB Atlas
**R2 uploads fail**: Verify R2 credentials and bucket permissions
**Tailwind not loading**: Ensure `@tailwindcss/postcss` is in dependencies
