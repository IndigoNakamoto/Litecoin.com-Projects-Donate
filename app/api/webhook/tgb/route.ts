// app/api/webhook/tgb/route.ts
// TGB (The Giving Block) webhook handler
// Receives donation events and triggers matching process

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { processDonationMatchingWithPayload } from '@/services/matching'

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
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eid },
  })

  if (existingEvent) {
    console.log(`[TGB Webhook] Event already processed: ${eid}`)
    return
  }

  // Find the associated Donation
  let donation = null
  if (pledgeId) {
    donation = await prisma.donation.findUnique({
      where: { pledgeId },
    })
  } else if (donationUuid) {
    donation = await prisma.donation.findUnique({
      where: { donationUuid },
    })
  }

  if (!donation) {
    throw new Error(
      `Donation with pledgeId ${pledgeId} or donationUuid ${donationUuid} not found`
    )
  }

  // Prepare update data
  const existingEventData = (donation.eventData as Record<string, unknown>) || {}
  
  // Update the Donation record
  await prisma.donation.update({
    where: { id: donation.id },
    data: {
      transactionHash: payload.transactionHash || null,
      payoutAmount: payload.payoutAmount,
      payoutCurrency: payload.payoutCurrency,
      externalId: payload.externalId,
      campaignId: payload.campaignId,
      valueAtDonationTimeUSD: payload.valueAtDonationTimeUSD || donation.valueAtDonationTimeUSD,
      currency: payload.currency,
      amount: payload.amount,
      status: payload.status,
      timestampms: new Date(Number(payload.timestampms)),
      eid: payload.eid,
      paymentMethod: payload.paymentMethod,
      eventData: {
        ...existingEventData,
        [eventType]: payload,
      },
      updatedAt: new Date(),
    },
  })

  // Create WebhookEvent record
  await prisma.webhookEvent.upsert({
    where: { eid },
    update: { processed: true },
    create: {
      eventType: 'DEPOSIT_TRANSACTION',
      payload: payload as unknown as Record<string, unknown>,
      donationId: donation.id,
      eid: payload.eid,
      processed: true,
    },
  })

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
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eid },
  })

  if (existingEvent) {
    console.log(`[TGB Webhook] Event already processed: ${eid}`)
    return
  }

  // Find the associated Donation
  const donation = await prisma.donation.findUnique({
    where: { pledgeId },
  })

  if (!donation) {
    throw new Error(`Donation with pledgeId ${pledgeId} not found`)
  }

  // Prepare update data
  const existingEventData = (donation.eventData as Record<string, unknown>) || {}

  // Update the Donation record
  await prisma.donation.update({
    where: { pledgeId },
    data: {
      convertedAt: new Date(Number(payload.convertedAt)),
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
      timestampms: new Date(Number(payload.timestampms)),
      eid: payload.eid,
      eventData: {
        ...existingEventData,
        [eventType]: payload,
      },
      updatedAt: new Date(),
    },
  })

  // Create WebhookEvent record
  await prisma.webhookEvent.create({
    data: {
      eventType: 'TRANSACTION_CONVERTED',
      payload: payload as unknown as Record<string, unknown>,
      donationId: donation.id,
      eid: payload.eid,
      processed: true,
    },
  })

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
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eid },
  })

  if (existingEvent) {
    console.log(`[TGB Webhook] Event already processed: ${eid}`)
    return
  }

  // Find the associated Donation
  let donation = null
  if (pledgeId) {
    donation = await prisma.donation.findUnique({
      where: { pledgeId },
    })
  } else if (donationUuid) {
    donation = await prisma.donation.findUnique({
      where: { donationUuid },
    })
  }

  if (!donation) {
    console.warn(`[TGB Webhook] Donation not found for unknown event: pledgeId=${pledgeId}, donationUuid=${donationUuid}`)
    return
  }

  // Update the Donation's eventData with the unknown event
  const existingEventData = (donation.eventData as Record<string, unknown>) || {}
  
  await prisma.donation.update({
    where: { id: donation.id },
    data: {
      eventData: {
        ...existingEventData,
        [eventType]: payload,
      },
      updatedAt: new Date(),
    },
  })

  // Create WebhookEvent record
  await prisma.webhookEvent.create({
    data: {
      eventType,
      payload,
      donationId: donation.id,
      eid,
      processed: true,
    },
  })

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

    // Trigger matching process (non-blocking)
    // We don't await this to avoid delaying the webhook response
    processDonationMatchingWithPayload()
      .then((result) => {
        console.log(`[TGB Webhook] Matching completed: processed=${result.processed}, matched=${result.matched}`)
      })
      .catch((error) => {
        console.error('[TGB Webhook] Matching failed:', error)
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
