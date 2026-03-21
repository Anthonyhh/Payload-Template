import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getPayload } from 'payload'
import config from '../payload.config'

async function verifyInfra() {
  console.log('Verifying infrastructure connectivity...')

  // 1. Check required env vars
  const required = ['MONGODB_URI', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_SERVER_URL']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error(`FAIL: Missing env vars: ${missing.join(', ')}`)
    process.exit(1)
  }
  console.log('PASS: Required env vars present')

  // 2. Verify MongoDB via Payload
  let payload
  try {
    payload = await getPayload({ config })
    // Attempt a read query against the users collection
    const result = await payload.find({ collection: 'users', limit: 1 })
    console.log(
      `PASS: MongoDB connected — users collection accessible (${result.totalDocs} users found)`,
    )
  } catch (error) {
    console.error(
      'FAIL: MongoDB connection failed:',
      error instanceof Error ? error.message : String(error),
    )
    if (payload) await payload.db.destroy().catch(() => {})
    process.exit(1)
  }

  // 3. Verify R2 / S3 configuration
  const r2Required = ['S3_BUCKET', 'S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']
  if (process.env.S3_ENABLED === 'true') {
    const r2Missing = r2Required.filter((k) => !process.env[k])
    if (r2Missing.length > 0) {
      console.error(`FAIL: S3_ENABLED=true but missing R2 vars: ${r2Missing.join(', ')}`)
      await payload?.db.destroy().catch(() => {})
      process.exit(1)
    }
    console.log('PASS: R2/S3 env vars present — upload test requires Payload admin (manual)')
  } else {
    console.log('INFO: S3_ENABLED not set — R2 storage disabled, using local filesystem')
  }

  console.log('All infrastructure checks passed.')
  await payload?.db.destroy().catch(() => {})
  process.exit(0)
}

verifyInfra().catch((error) => {
  console.error('Fatal:', error)
  process.exit(1)
})
