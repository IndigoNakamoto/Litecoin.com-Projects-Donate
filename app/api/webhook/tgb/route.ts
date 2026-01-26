// app/api/webhook/tgb/route.ts
// TGB (The Giving Block) webhook handler
// Receives donation events and triggers matching process

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
// Matching and database operations now handled by database API

// Define Webhook Event Types
type WebhookEventType = 'DEPOSIT_TRANSACTION' | 'TRANSACTION_CONVERTED' | string

type DepositTransactionPayload = {
  type: string
  id: string
  status: string
  timestampms: string
  eid: string
  transactionHash?: string
  currency: string
  amount: number
  organizationId: number
  eventTimestamp: string
  pledgeId?: string
  donationUuid?: string
  valueAtDonationTimeUSD: number
  paymentMethod: string
  payoutAmount: number | null
  payoutCurrency: string
  externalId: string
  campaignId: string
}

type TransactionConvertedPayload = {
  type: string
  id: string
  status: string
  timestampms: string
  eid: string
  transactionHash: string
  currency: string
  amount: number
  organizationId: number
  eventTimestamp: number
  convertedAt: string
  netValueAmount: number
  grossAmount: number
  netValueCurrency: string
  pledgeId: string
  valueAtDonationTimeUSD: number
  payoutAmount: number
  payoutCurrency: string
  externalId: string
  campaignId: string
}

type DecryptedPayload = DepositTransactionPayload | TransactionConvertedPayload | Record<string, unknown>

type WebhookRequest = {
  eventType: WebhookEventType
  payload: string // Encrypted hex string
}

/**
 * Decrypt AES-256-CBC encrypted payload from TGB
 */
function decryptPayload(encryptedHex: string): DecryptedPayload {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.TGB_AES_KEY || '', 'hex')
  const iv = Buffer.from(process.env.TGB_AES_IV || '', 'hex')

  if (key.length !== 32 || iv.length !== 16) {
    throw new Error('Invalid encryption key or IV length. TGB_AES_KEY must be 64 hex chars (32 bytes), TGB_AES_IV must be 32 hex chars (16 bytes)')
  }

  const encryptedData = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encryptedData, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  return JSON.parse(decrypted)
}

/**
 * Helper function to fetch donation by pledgeId or donationUuid via API
 */
async function fetchDonationByPledgeOrUuid(pledgeId?: string, donationUuid?: string): Promise<any> {
  const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
  
  if (pledgeId) {
    const response = await fetch(`${apiUrl}/api/donations/by-pledge-id/${encodeURIComponent(pledgeId)}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (response.ok) {
      const data = await response.json()
      return data.donation
    }
  }
  
  if (donationUuid) {
    const response = await fetch(`${apiUrl}/api/donations/by-donation-uuid/${encodeURIComponent(donationUuid)}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (response.ok) {
      const data = await response.json()
      return data.donation
    }
  }
  
  return null
}

/**
 * Helper function to check if webhook event exists via API
 */
async function checkWebhookEventExists(eid: string): Promise<boolean> {
  const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
  try {
    const response = await fetch(`${apiUrl}/api/webhook-events/${encodeURIComponent(eid)}`, {
      signal: AbortSignal.timeout(10000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Handler for DEPOSIT_TRANSACTION event
 */
async function handleDepositTransaction(
  eventType: WebhookEventType,
  payload: DepositTransactionPayload
): Promise<void> {
  const { pledgeId, donationUuid, eid } = payload

  if ((!pledgeId && !donationUuid) || !eid) {
    throw new Error('Missing pledgeId/donationUuid or eid in payload')
  }

  // Check if the event has already been processed (idempotency)
  const existingEvent = await checkWebhookEventExists(eid)

  if (existingEvent) {
    console.log(`[TGB Webhook] Event already processed: ${eid}`)
    return
  }

  // Find the associated Donation
  const donation = await fetchDonationByPledgeOrUuid(pledgeId, donationUuid)

  if (!donation) {
    throw new Error(
      `Donation with pledgeId ${pledgeId} or donationUuid ${donationUuid} not found`
    )
  }

  // Prepare update data
  const existingEventData = (donation.event_data as Record<string, unknown>) || {}
  
  // Update the Donation record via API
  const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
  const updateResponse = await fetch(`${apiUrl}/api/donations/${donation.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionHash: payload.transactionHash || null,
      payoutAmount: payload.payoutAmount,
      payoutCurrency: payload.payoutCurrency,
      externalId: payload.externalId,
      campaignId: payload.campaignId,
      valueAtDonationTimeUSD: payload.valueAtDonationTimeUSD || donation.value_at_donation_time_usd,
      currency: payload.currency,
      amount: payload.amount,
      status: payload.status,
      timestampms: new Date(Number(payload.timestampms)).toISOString(),
      eid: payload.eid,
      paymentMethod: payload.paymentMethod,
      eventData: {
        ...existingEventData,
        [eventType]: payload,
      },
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text()
    throw new Error(`Failed to update donation: ${updateResponse.status} ${errorText}`)
  }

  // Upsert WebhookEvent record via API
  const webhookResponse = await fetch(`${apiUrl}/api/webhook-events/${encodeURIComponent(eid)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'DEPOSIT_TRANSACTION',
      payload: payload,
      donationId: donation.id,
      processed: true,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!webhookResponse.ok) {
    const errorText = await webhookResponse.text()
    console.error(`Failed to create/update webhook event: ${webhookResponse.status} ${errorText}`)
    // Don't throw - donation update succeeded
  }

  console.log(`[TGB Webhook] Processed DEPOSIT_TRANSACTION: eid=${eid}, pledgeId=${pledgeId}, donationUuid=${donationUuid}`)
}

/**
 * Handler for TRANSACTION_CONVERTED event
 */
async function handleTransactionConverted(
  eventType: WebhookEventType,
  payload: TransactionConvertedPayload
): Promise<void> {
  const { pledgeId, eid } = payload

  if (!pledgeId || !eid) {
    throw new Error('Missing pledgeId or eid in payload')
  }

  // Check if the event has already been processed (idempotency)
  const existingEvent = await checkWebhookEventExists(eid)

  if (existingEvent) {
    console.log(`[TGB Webhook] Event already processed: ${eid}`)
    return
  }

  // Find the associated Donation
  const donation = await fetchDonationByPledgeOrUuid(pledgeId)

  if (!donation) {
    throw new Error(`Donation with pledgeId ${pledgeId} not found`)
  }

  // Prepare update data
  const existingEventData = (donation.event_data as Record<string, unknown>) || {}

  // Update the Donation record via API
  const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
  const updateResponse = await fetch(`${apiUrl}/api/donations/by-pledge-id/${encodeURIComponent(pledgeId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      convertedAt: new Date(Number(payload.convertedAt)).toISOString(),
      netValueAmount: payload.netValueAmount,
      grossAmount: payload.grossAmount,
      netValueCurrency: payload.netValueCurrency,
      payoutAmount: payload.payoutAmount,
      payoutCurrency: payload.payoutCurrency,
      externalId: payload.externalId,
      campaignId: payload.campaignId,
      valueAtDonationTimeUSD: payload.valueAtDonationTimeUSD,
      currency: payload.currency,
      amount: payload.amount,
      status: payload.status,
      timestampms: new Date(Number(payload.timestampms)).toISOString(),
      eid: payload.eid,
      eventData: {
        ...existingEventData,
        [eventType]: payload,
      },
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text()
    throw new Error(`Failed to update donation: ${updateResponse.status} ${errorText}`)
  }

  // Create WebhookEvent record via API
  const webhookResponse = await fetch(`${apiUrl}/api/webhook-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'TRANSACTION_CONVERTED',
      payload: payload,
      donationId: donation.id,
      eid: payload.eid,
      processed: true,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!webhookResponse.ok) {
    const errorText = await webhookResponse.text()
    console.error(`Failed to create webhook event: ${webhookResponse.status} ${errorText}`)
    // Don't throw - donation update succeeded
  }

  console.log(`[TGB Webhook] Processed TRANSACTION_CONVERTED: eid=${eid}, pledgeId=${pledgeId}`)
}

/**
 * Handler for unknown event types
 */
async function handleUnknownEvent(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const pledgeId = payload.pledgeId as string | undefined
  const donationUuid = payload.donationUuid as string | undefined
  const eid = payload.eid as string | undefined

  if ((!pledgeId && !donationUuid) || !eid) {
    console.warn(`[TGB Webhook] Missing pledgeId/donationUuid or eid in payload for unknown event: ${eventType}`)
    return
  }

  // Check if the event has already been processed (idempotency)
  const existingEvent = await checkWebhookEventExists(eid)

  if (existingEvent) {
    console.log(`[TGB Webhook] Event already processed: ${eid}`)
    return
  }

  // Find the associated Donation
  const donation = await fetchDonationByPledgeOrUuid(pledgeId, donationUuid)

  if (!donation) {
    console.warn(`[TGB Webhook] Donation not found for unknown event: pledgeId=${pledgeId}, donationUuid=${donationUuid}`)
    return
  }

  // Update the Donation's eventData with the unknown event
  const existingEventData = (donation.event_data as Record<string, unknown>) || {}
  
  const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
  const updateResponse = await fetch(`${apiUrl}/api/donations/${donation.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventData: {
        ...existingEventData,
        [eventType]: payload,
      },
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text()
    console.error(`Failed to update donation: ${updateResponse.status} ${errorText}`)
    // Don't throw - continue to create webhook event
  }

  // Create WebhookEvent record via API
  const webhookResponse = await fetch(`${apiUrl}/api/webhook-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType,
      payload: payload,
      donationId: donation.id,
      eid,
      processed: true,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!webhookResponse.ok) {
    const errorText = await webhookResponse.text()
    console.error(`Failed to create webhook event: ${webhookResponse.status} ${errorText}`)
    // Don't throw - donation update may have succeeded
  }

  console.log(`[TGB Webhook] Processed unknown event: type=${eventType}, eid=${eid}`)
}

/**
 * Event handler mapping
 */
const eventHandlers: Record<
  string,
  (eventType: WebhookEventType, payload: DecryptedPayload) => Promise<void>
> = {
  DEPOSIT_TRANSACTION: handleDepositTransaction as (eventType: WebhookEventType, payload: DecryptedPayload) => Promise<void>,
  TRANSACTION_CONVERTED: handleTransactionConverted as (eventType: WebhookEventType, payload: DecryptedPayload) => Promise<void>,
}

/**
 * POST /api/webhook/tgb
 * Handles incoming webhooks from The Giving Block
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WebhookRequest
    const { eventType, payload: encryptedPayload } = body

    console.log(`[TGB Webhook] Received event: ${eventType}`)

    // Decrypt the payload
    let decryptedPayload: DecryptedPayload
    try {
      decryptedPayload = decryptPayload(encryptedPayload)
    } catch (decryptError) {
      console.error('[TGB Webhook] Decryption failed:', decryptError)
      return NextResponse.json(
        { error: 'Failed to decrypt payload' },
        { status: 400 }
      )
    }

    // Validate eventTimestamp
    const eventTimestampMs = Number(decryptedPayload.eventTimestamp)
    if (isNaN(eventTimestampMs)) {
      console.warn(`[TGB Webhook] Invalid eventTimestamp: ${decryptedPayload.eventTimestamp}`)
      return NextResponse.json(
        { error: 'Invalid eventTimestamp' },
        { status: 400 }
      )
    }

    const currentTime = Date.now()
    const oneHourInMs = 60 * 60 * 1000

    if (currentTime - eventTimestampMs > oneHourInMs) {
      console.warn(`[TGB Webhook] Outdated event: timestamp=${eventTimestampMs}, current=${currentTime}`)
      return NextResponse.json(
        { error: 'Outdated event' },
        { status: 400 }
      )
    }

    // Process the event
    const handlerFunction = eventHandlers[eventType] || handleUnknownEvent
    await handlerFunction(eventType, decryptedPayload)

    // Trigger matching process via database API (non-blocking)
    // We don't await this to avoid delaying the webhook response
    const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
    fetch(`${apiUrl}/api/matching/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: false }),
    })
      .then(async (response) => {
        if (response.ok) {
          const result = await response.json()
          console.log(`[TGB Webhook] Matching completed: processed=${result.processed}, matched=${result.matched}`)
        } else {
          const errorText = await response.text()
          console.error(`[TGB Webhook] Matching API returned ${response.status}: ${errorText}`)
        }
      })
      .catch((error) => {
        console.error('[TGB Webhook] Matching API call failed:', error)
      })

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('[TGB Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
