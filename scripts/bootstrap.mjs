#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises'
import { execSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

function log(step, msg) { console.log(`\n[${step}] ${msg}`) }
function writeJSON(targetPath, data) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`  ✔ wrote ${path.relative(repoRoot, targetPath)}`)
}
function copyIfMissing(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
    console.log(`  ✔ created ${path.relative(repoRoot, dest)} from template`)
  } else { console.log(`  • ${path.relative(repoRoot, dest)} exists — skipping`) }
}
function boolFlag(name, fallback=false){const raw=process.argv.find(a=>a.startsWith(`--${name}=`));if(!raw)return fallback;const v=raw.split('=')[1];return ['1','true','yes','y','on'].includes(String(v).toLowerCase())}
function strFlag(name){const raw=process.argv.find(a=>a.startsWith(`--${name}=`));return raw?raw.split('=')[1]:undefined}
function spawn(cmd, cwd = repoRoot) { execSync(cmd, { stdio: 'inherit', cwd, env: process.env }) }
function generateSecret(len=48){const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';let o='';for(let i=0;i<len;i++)o+=c[Math.floor(Math.random()*c.length)];return o}

async function promptMissing(initial){
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = async (q, d) => { const v = await rl.question(`${q}${d?` (${d})`:''}: `); return v || d || '' }
  const cfg = { ...initial }
  if (!cfg.domain) cfg.domain = await ask('Domain (e.g., vitaehealth.co.uk)')
  if (!cfg.brand) cfg.brand = await ask('Brand name (e.g., VitaeHealth)')
  if (!cfg.primaryColor) cfg.primaryColor = await ask('Primary brand color (hex)', '#0053A6')
  if (!cfg.cta) cfg.cta = await ask('Primary CTA text', 'Book a 15-minute call')
  if (!cfg.keywords?.length) { const kw = await ask('Initial keywords (comma-separated)','ai automation, healthcare recruitment'); cfg.keywords = kw.split(',').map(s=>s.trim()).filter(Boolean) }
  if (!cfg.env?.PAYLOAD_SECRET) cfg.env = { ...(cfg.env||{}), PAYLOAD_SECRET: await ask('PAYLOAD_SECRET (random string)', generateSecret()) }
  rl.close(); return cfg
}

function ensureDotEnvFromExample(){
  const example = path.join(repoRoot, '.env.example')
  const dotEnv = path.join(repoRoot, '.env')
  if (!fs.existsSync(example)) {
    fs.writeFileSync(example, [
      'NODE_ENV=production','PAYLOAD_SECRET=change-me','MONGODB_URI=','NEXT_PUBLIC_SERVER_URL=','','# R2',
      'R2_BUCKET=','R2_ACCOUNT_ID=','R2_ACCESS_KEY_ID=','R2_SECRET_ACCESS_KEY=','R2_ENDPOINT=','','# useSend',
      'USESEND_API_KEY=','USESEND_BASE_URL=https://api.usesend.com','','# Flags','KEYWORD_PERSONALIZATION=1','SECURITY_HEADERS=1',''
    ].join('\n'), 'utf8'); console.log('  ✔ wrote .env.example')
  }
  if (!fs.existsSync(dotEnv)) { fs.copyFileSync(example, dotEnv); console.log('  ✔ created .env from .env.example — fill in credentials next') }
  else { console.log('  • .env already exists — not overwriting') }
}

async function main(){
  const nonInteractive = boolFlag('yes', false)
  const autoProvision = boolFlag('provision', false)
  const domain = strFlag('domain'); const brand = strFlag('brand'); const primaryColor = strFlag('color'); const cta = strFlag('cta')

  log('bootstrap','starting Flowstate blueprint setup')
  let config = { domain, brand, primaryColor, cta, keywords: [], env: { PAYLOAD_SECRET: process.env.PAYLOAD_SECRET } }
  config = nonInteractive ? (()=>{ if(!config.domain||!config.brand){console.error('❌ --yes needs --domain & --brand'); process.exit(1)}; if(!config.primaryColor)config.primaryColor='#0053A6'; if(!config.cta)config.cta='Book a 15-minute call'; if(!config.keywords?.length)config.keywords=['ai automation','consulting']; if(!config.env?.PAYLOAD_SECRET)config.env={PAYLOAD_SECRET:generateSecret()}; return config })() : await promptMissing(config)

  log('config','writing /config files')
  writeJSON(path.join(repoRoot,'config','site.json'), { name: config.brand, domain: config.domain, brandColor: config.primaryColor, keywords: config.keywords, cta: config.cta, theme: 'modern' })
  writeJSON(path.join(repoRoot,'config','env.json'), { VERCEL_PROJECT: 'flowstateit', MONGO_URI: process.env.MONGODB_URI ?? '', CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID ?? '', USESEND_KEY: process.env.USESEND_API_KEY ?? '', R2_BUCKET: process.env.R2_BUCKET ?? '' })
  copyIfMissing(path.join(repoRoot,'config','emails.json.example'), path.join(repoRoot,'config','emails.json'))

  log('env','ensuring .env from .env.example'); ensureDotEnvFromExample()

  try {
    const envPath = path.join(repoRoot, '.env')
    let envBody = fs.readFileSync(envPath, 'utf8')
    if (!/^NEXT_PUBLIC_SERVER_URL=/m.test(envBody)) {
      envBody += `\nNEXT_PUBLIC_SERVER_URL=https://cms.${config.domain}\n`
      fs.writeFileSync(envPath, envBody, 'utf8')
      console.log('  ✔ set NEXT_PUBLIC_SERVER_URL in .env')
    }
  } catch { console.warn('  • could not update .env automatically') }

  if (!autoProvision) {
    log('next','bootstrap complete. next steps:')
    console.log(`
1) Fill credentials in .env and config/env.json.
2) Commit/push repo.
3) Provision via Claude Task Master (MCP):
   npx task-master-ai init --project "${config.brand} Website"
   npx task-master-ai parse-prd docs/PRD.md --num-tasks=80
   npx task-master-ai generate
   npx task-master-ai run --match "EPIC-01: Infrastructure Provisioning"
4) Deploy & map DNS:
   - Vercel: connect GitHub repo, set env vars
   - Cloudflare: CNAME cms.${config.domain} → <vercel-domain> (orange)
5) Verify:
   curl -s https://cms.${config.domain}/api/health
   open https://cms.${config.domain}/admin
`); return
  }

  log('provision','attempting automated provisioning via Claude Task Master')
  try {
    execSync(`npx task-master-ai init --project "Website - ${config.brand}"`, { stdio: 'inherit' })
    execSync('npx task-master-ai parse-prd docs/PRD.md --num-tasks=80', { stdio: 'inherit' })
    execSync('npx task-master-ai generate', { stdio: 'inherit' })
    execSync('npx task-master-ai run --match "EPIC-01: Infrastructure Provisioning"', { stdio: 'inherit' })
  } catch { console.warn('  • automated provisioning hit an error; run commands manually.') }

  log('done',`bootstrap completed for ${config.brand} (${config.domain})`)
}

main().catch((e)=>{ console.error(e); process.exit(1) })
