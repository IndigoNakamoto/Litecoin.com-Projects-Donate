import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'
import { generateReport } from '@/lib/reports'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

/**
 * POST /api/cron/monthly
 * Monthly cron job to generate and send monthly donation report to Discord
 * 
 * Called by Vercel cron jobs on the 1st of each month at midnight UTC (0 0 1 * *)
 */
export async function POST(request: NextRequest) {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('[cron/monthly] DISCORD_WEBHOOK_URL is not set')
    return NextResponse.json(
      { error: 'Env misconfigured: DISCORD_WEBHOOK_URL is not set.' },
      { status: 500 }
    )
  }

  try {
    const reportPdf = await generateReport(
      30 * 24 * 60 * 60 * 1000,
      'Monthly'
    )
    const form = new FormData()
    form.append('file', reportPdf, {
      filename: 'monthly-report.pdf',
      contentType: 'application/pdf',
    })

    await axios.post(DISCORD_WEBHOOK_URL, form, {
      headers: form.getHeaders(),
    })

    console.log('[cron/monthly] Monthly summary sent successfully')
    return NextResponse.json({ message: 'Monthly summary sent successfully.' })
  } catch (err) {
    console.error('[cron/monthly] Error sending monthly summary:', err)
    return NextResponse.json(
      { 
        statusCode: 500, 
        message: err instanceof Error ? err.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

