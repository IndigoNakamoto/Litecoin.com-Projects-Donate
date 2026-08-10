import PDFDocument from 'pdfkit'
import { prisma } from './prisma'
import {
  formatUsd,
  type DiscordEmbed,
} from './discord'
import {
  getMatchingPoolStatuses,
  type MatchingPoolStatus,
} from '@/services/matching'
import { createPayloadClient, fetchAllPages } from '@/services/payload/client'
import type { PayloadProject } from '@/services/payload/types'

export type ReportDonationLine = {
  id: number
  donorEmail: string | null
  firstName: string | null
  lastName: string | null
  projectSlug: string
  valueAtDonationTimeUSD: number
  matchedAmount: number
}

export type ReportProjectGroup = {
  slug: string
  name: string
  raised: number
  matched: number
  count: number
  donations: ReportDonationLine[]
}

export type ReportData = {
  since: Date
  windowMs: number
  windowDays: number
  totalRaised: number
  totalMatched: number
  donationCount: number
  projects: ReportProjectGroup[]
  pools: MatchingPoolStatus[]
}

const MAX_EMBED_PROJECTS = 12

async function resolveProjectNames(
  slugs: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (slugs.length === 0) return map

  try {
    const client = createPayloadClient()
    const projects = await fetchAllPages<PayloadProject>(client, '/projects', {
      depth: 0,
    })
    const wanted = new Set(slugs.map((s) => s.trim().toLowerCase()))
    for (const p of projects) {
      const key = p.slug?.trim().toLowerCase()
      if (key && wanted.has(key) && p.name) {
        map.set(key, p.name)
      }
    }
  } catch (err) {
    console.warn(
      '[reports] Failed to resolve project names from Payload:',
      err instanceof Error ? err.message : err
    )
  }

  return map
}

export async function buildReportData(windowMs: number): Promise<ReportData> {
  const since = new Date(Date.now() - windowMs)
  const windowDays = windowMs / (1000 * 60 * 60 * 24)

  const donations = await prisma.donation.findMany({
    where: {
      createdAt: { gte: since },
      status: { in: ['Complete', 'Advanced', 'COMPLETED'] },
      valueAtDonationTimeUSD: { gte: 2 },
    },
    select: {
      id: true,
      projectSlug: true,
      valueAtDonationTimeUSD: true,
      donorEmail: true,
      firstName: true,
      lastName: true,
    },
  })

  const matchingDonations = await prisma.matchingDonationLog.findMany({
    where: { date: { gte: since } },
    select: { donationId: true, matchedAmount: true },
  })

  const matchByDonationId = new Map<number, number>()
  for (const md of matchingDonations) {
    const prev = matchByDonationId.get(md.donationId) ?? 0
    const amount =
      typeof md.matchedAmount?.toNumber === 'function'
        ? md.matchedAmount.toNumber()
        : Number(md.matchedAmount) || 0
    matchByDonationId.set(md.donationId, prev + amount)
  }

  const bySlug: Record<
    string,
    {
      donations: ReportDonationLine[]
      raised: number
      matched: number
    }
  > = {}

  for (const d of donations) {
    const usd = d.valueAtDonationTimeUSD?.toNumber() ?? 0
    if (usd < 2) continue
    const matched = matchByDonationId.get(d.id) ?? 0
    const slug = d.projectSlug
    if (!bySlug[slug]) {
      bySlug[slug] = { donations: [], raised: 0, matched: 0 }
    }
    bySlug[slug].donations.push({
      id: d.id,
      donorEmail: d.donorEmail,
      firstName: d.firstName,
      lastName: d.lastName,
      projectSlug: slug,
      valueAtDonationTimeUSD: usd,
      matchedAmount: matched,
    })
    bySlug[slug].raised += usd
    bySlug[slug].matched += matched
  }

  const slugs = Object.keys(bySlug)
  const nameMap = await resolveProjectNames(slugs)

  const projects: ReportProjectGroup[] = slugs
    .map((slug) => {
      const g = bySlug[slug]
      return {
        slug,
        name: nameMap.get(slug.trim().toLowerCase()) ?? slug,
        raised: g.raised,
        matched: g.matched,
        count: g.donations.length,
        donations: g.donations,
      }
    })
    .sort((a, b) => b.raised - a.raised)

  let totalRaised = 0
  let totalMatched = 0
  let donationCount = 0
  for (const p of projects) {
    totalRaised += p.raised
    totalMatched += p.matched
    donationCount += p.count
  }

  let pools: MatchingPoolStatus[] = []
  try {
    pools = await getMatchingPoolStatuses()
  } catch (err) {
    console.warn(
      '[reports] Failed to load matching pools:',
      err instanceof Error ? err.message : err
    )
  }

  return {
    since,
    windowMs,
    windowDays,
    totalRaised,
    totalMatched,
    donationCount,
    projects,
    pools,
  }
}

function formatPoolLines(pools: MatchingPoolStatus[]): string[] {
  if (pools.length === 0) return ['No active matching pools']
  return pools.map((p) => {
    const label = p.poolLabel === 'Foundation' ? 'Foundation pool' : `${p.poolLabel} pool`
    return `${label} (${p.name}): ${formatUsd(p.remaining)} left of ${formatUsd(p.cap)} (YTD ${formatUsd(p.matchedYtd)})`
  })
}

export function buildReportEmbed(
  data: ReportData,
  reportType: 'Daily' | 'Monthly'
): DiscordEmbed {
  const projectLines =
    data.projects.length === 0
      ? [`No confirmed donations in the last ${data.windowDays} day(s).`]
      : data.projects.slice(0, MAX_EMBED_PROJECTS).map((p) => {
          const label = p.name !== p.slug ? `${p.name} (\`${p.slug}\`)` : `\`${p.slug}\``
          return `• ${label} · ${formatUsd(p.raised)} raised · ${formatUsd(p.matched)} matched · ${p.count} gift${p.count === 1 ? '' : 's'}`
        })

  if (data.projects.length > MAX_EMBED_PROJECTS) {
    projectLines.push(
      `• +${data.projects.length - MAX_EMBED_PROJECTS} more project(s) — see PDF`
    )
  }

  const description = [
    `**Period:** ${formatUsd(data.totalRaised)} raised · ${formatUsd(data.totalMatched)} matched · ${data.donationCount} gift${data.donationCount === 1 ? '' : 's'}`,
    '',
    '**By project**',
    ...projectLines,
    '',
    '**Matching pools (YTD)**',
    ...formatPoolLines(data.pools).map((l) => `• ${l}`),
  ].join('\n')

  // Discord embed description max ~4096
  const trimmed =
    description.length > 4000
      ? `${description.slice(0, 3990)}\n…`
      : description

  return {
    title: `${reportType} Donation Summary`,
    description: trimmed,
    color: 0x345d9d,
    footer: { text: 'Litecoin Open Source Fund · ops digest' },
    timestamp: new Date().toISOString(),
  }
}

export async function generateReportPdf(
  data: ReportData,
  reportType: 'Daily' | 'Monthly'
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument()
    const buffers: Buffer[] = []

    doc.on('data', (chunk: Buffer) => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    doc.fontSize(16).text(`${reportType} Donation Summary`, { align: 'center' })
    doc.moveDown()
    doc
      .fontSize(11)
      .text(
        `Period: last ${data.windowDays} day(s) · Raised ${data.totalRaised.toFixed(2)} USD · Matched ${data.totalMatched.toFixed(2)} USD · ${data.donationCount} gifts`
      )
    doc.moveDown()

    if (data.projects.length === 0) {
      doc
        .fontSize(12)
        .text(`No donations in the last ${data.windowDays} days.`, {
          align: 'center',
        })
    } else {
      for (const p of data.projects) {
        doc
          .fontSize(14)
          .text(`Project: ${p.name} (${p.slug})`, { underline: true })
          .moveDown(0.5)
        doc
          .fontSize(12)
          .text(
            `Total Donations: ${p.raised.toFixed(2)} USD | Total Matched: ${p.matched.toFixed(2)} USD`
          )
        doc.moveDown()

        for (const d of p.donations) {
          const donationLine = `- ${d.firstName ?? ''} ${d.lastName ?? ''} (${
            d.donorEmail ?? 'no-email'
          }): ${d.valueAtDonationTimeUSD.toFixed(2)} USD (Matched: ${d.matchedAmount.toFixed(2)} USD)\n`
          doc.fontSize(10).text(donationLine)
        }
        doc.moveDown()
      }
    }

    doc.moveDown()
    doc.fontSize(14).text('Matching pools remaining (YTD)', { underline: true })
    doc.moveDown(0.5)
    for (const line of formatPoolLines(data.pools)) {
      doc.fontSize(11).text(`• ${line}`)
    }

    doc.end()
  })
}

/**
 * Backward-compatible: build data + PDF for a time window.
 */
export async function generateReport(
  timeInMs: number,
  reportType: 'Daily' | 'Monthly'
): Promise<Buffer> {
  const data = await buildReportData(timeInMs)
  return generateReportPdf(data, reportType)
}

export async function getMatchedDonations(): Promise<number> {
  const donationsMatchedResult = await prisma.matchingDonationLog.aggregate({
    _sum: {
      matchedAmount: true,
    },
  })

  return donationsMatchedResult._sum.matchedAmount?.toNumber() ?? 0
}

