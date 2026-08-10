import { prisma } from '@/lib/prisma'
import {
  formatDonorDisplayName,
  formatUsd,
  getDonationsWebhookUrl,
  isConfirmedDonationStatus,
  postDiscordWebhook,
  type DiscordEmbed,
} from '@/lib/discord'
import { getMatchingPoolStatuses } from '@/services/matching'

const MIN_USD = 2

/** Crypto payment methods typically get a later TRANSACTION_CONVERTED — skip deposit alerts for these */
const CRYPTO_PAYMENT_METHOD =
  /^(btc|ltc|eth|bitcoin|litecoin|ethereum|crypto|usdc|usdt|sol|doge|bch|ada|matic|polygon)/i

export type ConfirmedDonationAlertInput = {
  donationId: number
  projectSlug: string
  valueUsd: number
  firstName: string | null
  lastName: string | null
  status: string
  eventType: 'TRANSACTION_CONVERTED' | 'DEPOSIT_TRANSACTION'
  paymentMethod?: string | null
}

export function shouldAlertConfirmedDonation(
  input: Pick<
    ConfirmedDonationAlertInput,
    'status' | 'valueUsd' | 'eventType' | 'paymentMethod'
  >
): boolean {
  if (!isConfirmedDonationStatus(input.status)) return false
  if (!(input.valueUsd >= MIN_USD)) return false

  if (input.eventType === 'DEPOSIT_TRANSACTION') {
    const method = (input.paymentMethod ?? '').trim()
    // Prefer TRANSACTION_CONVERTED for crypto; deposit alerts for fiat/edge cases
    if (method && CRYPTO_PAYMENT_METHOD.test(method)) return false
  }

  return true
}

export async function notifyConfirmedDonation(
  input: ConfirmedDonationAlertInput
): Promise<void> {
  if (!shouldAlertConfirmedDonation(input)) return

  const webhookUrl = getDonationsWebhookUrl()
  if (!webhookUrl) return

  let matchedAmount = 0
  try {
    const match = await prisma.matchingDonationLog.aggregate({
      where: { donationId: input.donationId },
      _sum: { matchedAmount: true },
    })
    matchedAmount = match._sum.matchedAmount?.toNumber() ?? 0
  } catch (err) {
    console.warn(
      '[donation-discord-alert] Failed to load match amount:',
      err instanceof Error ? err.message : err
    )
  }

  let poolLines: string[] = []
  try {
    const pools = await getMatchingPoolStatuses()
    const slug = input.projectSlug.trim().toLowerCase()
    const relevant = pools.filter(
      (p) =>
        p.matchingType === 'all-projects' ||
        p.supportedProjectSlugs.some((s) => s.trim().toLowerCase() === slug)
    )
    const toShow = relevant.length > 0 ? relevant : pools
    poolLines = toShow.map(
      (p) =>
        `${p.poolLabel}: ${formatUsd(p.remaining)} left of ${formatUsd(p.cap)}`
    )
  } catch (err) {
    console.warn(
      '[donation-discord-alert] Failed to load matching pools:',
      err instanceof Error ? err.message : err
    )
  }

  const donor = formatDonorDisplayName(input.firstName, input.lastName)
  const embed: DiscordEmbed = {
    title: 'Donation confirmed',
    color: 0x2ecc71,
    fields: [
      { name: 'Amount', value: formatUsd(input.valueUsd), inline: true },
      { name: 'Matched', value: formatUsd(matchedAmount), inline: true },
      { name: 'Project', value: `\`${input.projectSlug}\``, inline: true },
      { name: 'Donor', value: donor, inline: true },
      {
        name: 'Matching remaining',
        value: poolLines.length > 0 ? poolLines.join('\n') : '—',
        inline: false,
      },
    ],
    footer: { text: `donation #${input.donationId} · ${input.eventType}` },
    timestamp: new Date().toISOString(),
  }

  await postDiscordWebhook(webhookUrl, { embeds: [embed] })
}
