/**
 * One-shot ops Discord smoke test. Posts to donations + projects webhooks
 * using the same builders as production. Not for cron scheduling.
 *
 * Usage (from litecoin-fund):
 *   DISCORD_PROJECTS_WEBHOOK_URL=... npx tsx scripts/test-discord-ops-alerts.ts
 */
import {
  getDonationsWebhookUrl,
  getProjectsWebhookUrl,
  postDiscordWebhook,
  formatUsd,
} from '../lib/discord'
import {
  buildReportData,
  buildReportEmbed,
  generateReportPdf,
} from '../lib/reports'
import { notifyConfirmedDonation } from '../lib/donation-discord-alert'
import { getMatchingPoolStatuses } from '../services/matching'

async function step(name: string, fn: () => Promise<void>) {
  process.stdout.write(`→ ${name}... `)
  try {
    await fn()
    console.log('ok')
  } catch (err) {
    console.log('FAIL')
    console.error(err)
    throw err
  }
}

async function main() {
  const donations = getDonationsWebhookUrl()
  const projects = getProjectsWebhookUrl()

  if (!donations) {
    throw new Error('DISCORD_WEBHOOK_URL is not set')
  }
  console.log('Donations webhook: set')
  console.log(
    'Projects webhook:',
    process.env.DISCORD_PROJECTS_WEBHOOK_URL ? 'DISCORD_PROJECTS_WEBHOOK_URL' : 'fallback to donations'
  )

  await step('matching pools (sanity)', async () => {
    const pools = await getMatchingPoolStatuses()
    console.log(`\n  pools=${pools.length}`)
    for (const p of pools) {
      console.log(
        `  - ${p.poolLabel}: ${formatUsd(p.remaining)} left of ${formatUsd(p.cap)}`
      )
    }
  })

  await step('daily digest embed + PDF → donations', async () => {
    const data = await buildReportData(24 * 60 * 60 * 1000)
    const pdf = await generateReportPdf(data, 'Daily')
    const embed = buildReportEmbed(data, 'Daily')
    embed.footer = { text: 'TEST · Daily Donation Summary' }
    const ok = await postDiscordWebhook(donations, {
      content: '**[TEST]** Daily donation digest',
      embeds: [embed],
      files: [
        {
          filename: 'daily-report-test.pdf',
          contentType: 'application/pdf',
          buffer: pdf,
        },
      ],
    })
    if (!ok) throw new Error('Discord post failed')
  })

  await step('monthly digest embed + PDF → donations', async () => {
    const data = await buildReportData(30 * 24 * 60 * 60 * 1000)
    const pdf = await generateReportPdf(data, 'Monthly')
    const embed = buildReportEmbed(data, 'Monthly')
    embed.footer = { text: 'TEST · Monthly Donation Summary' }
    const ok = await postDiscordWebhook(donations, {
      content: '**[TEST]** Monthly donation digest',
      embeds: [embed],
      files: [
        {
          filename: 'monthly-report-test.pdf',
          contentType: 'application/pdf',
          buffer: pdf,
        },
      ],
    })
    if (!ok) throw new Error('Discord post failed')
  })

  await step('realtime confirmed-donation alert → donations', async () => {
    // Prefer a real recent confirmed donation if present
    const { prisma } = await import('../lib/prisma')
    const recent = await prisma.donation.findFirst({
      where: {
        status: { in: ['Complete', 'Advanced', 'COMPLETED'] },
        valueAtDonationTimeUSD: { gte: 2 },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        projectSlug: true,
        valueAtDonationTimeUSD: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    })

    await notifyConfirmedDonation({
      donationId: recent?.id ?? 0,
      projectSlug: recent?.projectSlug ?? 'test-project',
      valueUsd: recent?.valueAtDonationTimeUSD?.toNumber() ?? 42.5,
      firstName: recent?.firstName ?? 'Test',
      lastName: recent?.lastName ?? 'Donor',
      status: recent?.status ?? 'Complete',
      eventType: 'TRANSACTION_CONVERTED',
      paymentMethod: 'LTC',
    })

    // Tag so it's obvious in-channel (notifyConfirmedDonation has no content field)
    await postDiscordWebhook(donations, {
      content: '**[TEST]** Realtime donation alert (embed above uses live match/pool data when donation id > 0)',
    })
  })

  await step('backup-style status → donations', async () => {
    const ok = await postDiscordWebhook(donations, {
      content: [
        '**[TEST]** ✅ **Litecoin daily backup complete** (smoke-test)',
        '• CMS: (test) — n/a',
        '• Donations: (test) — n/a',
        '• Path: `backups/daily/TEST`',
      ].join('\n'),
    })
    if (!ok) throw new Error('Discord post failed')
  })

  await step('project application embed → projects channel', async () => {
    if (!projects) throw new Error('No projects webhook URL')
    const ok = await postDiscordWebhook(projects, {
      content: '**[TEST]** Project application notification',
      embeds: [
        {
          title: 'New project application',
          color: 0x345d9d,
          fields: [
            { name: 'Project', value: 'Discord Ops Smoke Test Project', inline: false },
            {
              name: 'Review',
              value: 'https://projects.lite.space/projects/submitted/test',
              inline: false,
            },
          ],
          footer: { text: 'TEST · project applications routing' },
          timestamp: new Date().toISOString(),
        },
      ],
    })
    if (!ok) throw new Error('Discord post failed')
  })

  console.log('\nAll Discord smoke tests posted.')
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
