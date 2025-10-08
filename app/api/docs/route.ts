import { NextResponse } from 'next/server'
import { apiDocumentation } from '@/lib/api-docs'

export async function GET() {
  try {
    return NextResponse.json(apiDocumentation)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load API documentation',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
