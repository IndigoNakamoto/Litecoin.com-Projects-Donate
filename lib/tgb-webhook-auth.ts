import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

/**
 * Verify x-givingblock-signature HMAC over the encrypted payload hex string.
 * When GIVING_BLOCK_SIGNING_SECRET is unset, allow only if WEBHOOK_HMAC_OPTIONAL=true
 * (cutover mode). Fail closed otherwise.
 */
export function verifyTgbWebhookSignature(
  request: NextRequest,
  encryptedPayload: string
): { ok: true } | { ok: false; status: number; error: string } {
  const signingSecret = process.env.GIVING_BLOCK_SIGNING_SECRET
  const optional =
    process.env.WEBHOOK_HMAC_OPTIONAL?.trim().toLowerCase() === 'true' ||
    process.env.WEBHOOK_HMAC_OPTIONAL === '1'

  if (!signingSecret) {
    if (optional) {
      console.warn(
        '[TGB Webhook] GIVING_BLOCK_SIGNING_SECRET unset; allowing because WEBHOOK_HMAC_OPTIONAL=true'
      )
      return { ok: true }
    }
    return {
      ok: false,
      status: 401,
      error: 'Webhook signing secret not configured',
    }
  }

  const signature = request.headers.get('x-givingblock-signature')
  if (!signature) {
    return { ok: false, status: 401, error: 'Missing webhook signature' }
  }

  const expected = createHmac('sha256', signingSecret)
    .update(encryptedPayload)
    .digest('hex')

  try {
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return { ok: false, status: 401, error: 'Invalid webhook signature' }
    }
  } catch {
    return { ok: false, status: 401, error: 'Invalid webhook signature' }
  }

  return { ok: true }
}
