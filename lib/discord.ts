import FormData from 'form-data'
import axios from 'axios'

export type DiscordEmbedField = {
  name: string
  value: string
  inline?: boolean
}

export type DiscordEmbed = {
  title?: string
  description?: string
  color?: number
  fields?: DiscordEmbedField[]
  footer?: { text: string }
  timestamp?: string
}

export type DiscordFile = {
  filename: string
  contentType: string
  buffer: Buffer
}

export type DiscordWebhookPayload = {
  content?: string
  embeds?: DiscordEmbed[]
  files?: DiscordFile[]
}

const CONFIRMED_STATUSES = new Set(['Complete', 'Advanced', 'COMPLETED'])

function normalizeSecret(value: string | undefined): string | undefined {
  if (value == null) return undefined
  let t = value.trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim()
  }
  return t.length > 0 ? t : undefined
}

/** #litecoin-donations — digests, realtime donations, backup */
export function getDonationsWebhookUrl(): string | undefined {
  return normalizeSecret(process.env.DISCORD_WEBHOOK_URL)
}

/** #litecoin-projects-server — project applications (falls back to donations URL) */
export function getProjectsWebhookUrl(): string | undefined {
  return (
    normalizeSecret(process.env.DISCORD_PROJECTS_WEBHOOK_URL) ||
    getDonationsWebhookUrl()
  )
}

export function isConfirmedDonationStatus(status: string | null | undefined): boolean {
  if (!status) return false
  return CONFIRMED_STATUSES.has(status)
}

/** Discord-safe donor label: "First L." — never email */
export function formatDonorDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = (firstName ?? '').trim()
  const last = (lastName ?? '').trim()
  if (first && last) return `${first} ${last.charAt(0).toUpperCase()}.`
  if (first) return first
  if (last) return `${last.charAt(0).toUpperCase()}.`
  return 'Anonymous'
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Post to a Discord incoming webhook. Soft-fails (logs, never throws).
 * Supports JSON embeds and multipart (embed + file) via payload_json.
 */
export async function postDiscordWebhook(
  url: string | undefined,
  payload: DiscordWebhookPayload
): Promise<boolean> {
  if (!url) {
    console.warn('[discord] Webhook URL not set; skipping notification')
    return false
  }

  try {
    if (payload.files && payload.files.length > 0) {
      const form = new FormData()
      const body: Record<string, unknown> = {}
      if (payload.content) body.content = payload.content
      if (payload.embeds) body.embeds = payload.embeds
      form.append('payload_json', JSON.stringify(body))

      payload.files.forEach((file, i) => {
        form.append(`files[${i}]`, file.buffer, {
          filename: file.filename,
          contentType: file.contentType,
        })
      })

      await axios.post(url, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
    } else {
      await axios.post(url, {
        content: payload.content,
        embeds: payload.embeds,
      })
    }
    return true
  } catch (err) {
    console.error(
      '[discord] Webhook post failed:',
      err instanceof Error ? err.message : err
    )
    return false
  }
}
