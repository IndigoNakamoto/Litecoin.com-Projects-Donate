import { timingSafeEqual } from 'crypto'

function safeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

/**
 * Council review pages require ?token=${COUNCIL_REVIEW_SECRET}
 * (or Authorization: Bearer ${COUNCIL_REVIEW_SECRET}).
 */
export function isCouncilAuthorized(
  tokenFromQuery: string | null | undefined,
  authHeader: string | null | undefined
): boolean {
  const secret = process.env.COUNCIL_REVIEW_SECRET
  if (!secret) {
    console.error('[council-auth] COUNCIL_REVIEW_SECRET is not set')
    return false
  }

  if (tokenFromQuery && safeEqualString(tokenFromQuery, secret)) {
    return true
  }

  if (authHeader) {
    const expected = `Bearer ${secret}`
    if (safeEqualString(authHeader, expected)) {
      return true
    }
  }

  return false
}
