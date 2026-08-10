import { NextRequest, NextResponse } from 'next/server'
import {
  buildReportData,
  buildReportEmbed,
  generateReportPdf,
} from '@/lib/reports'
import { getDonationsWebhookUrl, postDiscordWebhook } from '@/lib/discord'
import { requireCronAuth } from '@/lib/cron-auth'

/**
 * POST /api/cron/monthly
 * Monthly cron job to generate and send monthly donation report to Discord
 *
 * Called by Vercel cron jobs on the 1st of each month at midnight UTC (0 0 1 * *)
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request)
  if (unauthorized) return unauthorized

  const webhookUrl = getDonationsWebhookUrl()
  if (!webhookUrl) {
    console.error('[cron/monthly] DISCORD_WEBHOOK_URL is not set')
    return NextResponse.json(
      { error: 'Env misconfigured: DISCORD_WEBHOOK_URL is not set.' },
      { status: 500 }
    )
  }

  try {
    const data = await buildReportData(30 * 24 * 60 * 60 * 1000)
    const reportPdf = await generateReportPdf(data, 'Monthly')
    const embed = buildReportEmbed(data, 'Monthly')

    const ok = await postDiscordWebhook(webhookUrl, {
      embeds: [embed],
      files: [
        {
          filename: 'monthly-report.pdf',
          contentType: 'application/pdf',
          buffer: reportPdf,
        },
      ],
    })

    if (!ok) {
      return NextResponse.json(
        { statusCode: 500, message: 'Failed to post Discord webhook' },
        { status: 500 }
      )
    }

    console.log('[cron/monthly] Monthly summary sent successfully')
    return NextResponse.json({ message: 'Monthly summary sent successfully.' })
  } catch (err) {
    console.error('[cron/monthly] Error sending monthly summary:', err)
    return NextResponse.json(
      {
        statusCode: 500,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
