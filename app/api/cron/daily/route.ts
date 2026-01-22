import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'
import { generateReport } from '@/lib/reports'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

/**
 * POST /api/cron/daily
 * Daily cron job to generate and send daily donation report to Discord
 * 
 * Called by Vercel cron jobs at midnight UTC (0 0 * * *)
 */
export async function POST(request: NextRequest) {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('[cron/daily] DISCORD_WEBHOOK_URL is not set')
    return NextResponse.json(
      { error: 'Env misconfigured: DISCORD_WEBHOOK_URL is not set.' },
      { status: 500 }
    )
  }

  try {
    const reportPdf = await generateReport(24 * 60 * 60 * 1000, 'Daily')
    const form = new FormData()
    form.append('file', reportPdf, {
      filename: 'daily-report.pdf',
      contentType: 'application/pdf',
    })

    await axios.post(DISCORD_WEBHOOK_URL, form, {
      headers: form.getHeaders(),
    })

    console.log('[cron/daily] Daily summary sent successfully')
    return NextResponse.json({ message: 'Daily summary sent successfully.' })
  } catch (err) {
    console.error('[cron/daily] Error sending daily summary:', err)
    return NextResponse.json(
      { 
        statusCode: 500, 
        message: err instanceof Error ? err.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

