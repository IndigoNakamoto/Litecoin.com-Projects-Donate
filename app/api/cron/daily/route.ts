import { NextRequest, NextResponse } from 'next/server'
import {
  buildReportData,
  buildReportEmbed,
  generateReportPdf,
} from '@/lib/reports'
import { getDonationsWebhookUrl, postDiscordWebhook } from '@/lib/discord'
import { requireCronAuth } from '@/lib/cron-auth'

/**
 * POST /api/cron/daily
 * Daily cron job to generate and send daily donation report to Discord
 *
 * Called by Vercel cron jobs at midnight UTC (0 0 * * *)
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request)
  if (unauthorized) return unauthorized

  const webhookUrl = getDonationsWebhookUrl()
  if (!webhookUrl) {
    console.error('[cron/daily] DISCORD_WEBHOOK_URL is not set')
    return NextResponse.json(
      { error: 'Env misconfigured: DISCORD_WEBHOOK_URL is not set.' },
      { status: 500 }
    )
  }

  try {
    const data = await buildReportData(24 * 60 * 60 * 1000)
    const reportPdf = await generateReportPdf(data, 'Daily')
    const embed = buildReportEmbed(data, 'Daily')

    const ok = await postDiscordWebhook(webhookUrl, {
      embeds: [embed],
      files: [
        {
          filename: 'daily-report.pdf',
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

    console.log('[cron/daily] Daily summary sent successfully')
    return NextResponse.json({ message: 'Daily summary sent successfully.' })
  } catch (err) {
    console.error('[cron/daily] Error sending daily summary:', err)
    return NextResponse.json(
      {
        statusCode: 500,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
