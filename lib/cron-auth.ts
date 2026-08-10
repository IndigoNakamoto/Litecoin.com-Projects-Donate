import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

function safeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

/**
 * Require Authorization: Bearer ${CRON_SECRET}.
 * Fails closed if CRON_SECRET is unset.
 */
export function requireCronAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron-auth] CRON_SECRET is not set; rejecting request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization') || ''
  const expected = `Bearer ${cronSecret}`
  if (!safeEqualString(authHeader, expected)) {
    console.log(`[cron-auth] Unauthorized access attempt at ${new Date().toISOString()}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
