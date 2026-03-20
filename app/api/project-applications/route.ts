import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { prisma } from '@/lib/prisma'
import { getPublicSiteOrigin, submissionDetailPath } from '@/lib/public-site-url'

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

function parseSubmission(body: unknown): {
  projectName: string
  applicantEmail: string
  payload: Prisma.InputJsonValue
} | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const overview = o.project_overview
  const applicant = o.applicant_information
  if (!overview || typeof overview !== 'object' || !applicant || typeof applicant !== 'object')
    return null
  const po = overview as Record<string, unknown>
  const ai = applicant as Record<string, unknown>
  const projectName = typeof po.project_name === 'string' ? po.project_name.trim() : ''
  const applicantEmail = typeof ai.email === 'string' ? ai.email.trim() : ''
  if (!projectName || !applicantEmail) return null
  return { projectName, applicantEmail, payload: body as Prisma.InputJsonValue }
}

/**
 * POST /api/project-applications
 * Persists project submission to PostgreSQL and notifies Discord (if DISCORD_WEBHOOK_URL is set).
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parseSubmission(body)
  if (!parsed) {
    return NextResponse.json(
      { message: 'Invalid submission: project_overview.project_name and applicant_information.email are required' },
      { status: 400 }
    )
  }

  try {
    const application = await prisma.projectApplication.create({
      data: {
        status: 'pending',
        projectName: parsed.projectName,
        applicantEmail: parsed.applicantEmail,
        payload: parsed.payload,
      },
    })

    const webhook = normalizeSecret(process.env.DISCORD_WEBHOOK_URL)
    if (webhook) {
      try {
        const origin = getPublicSiteOrigin(request)
        const submissionUrl = `${origin}${submissionDetailPath(application.id)}`
        const content = `New Project Application - ${application.projectName} ${submissionUrl}`
        await axios.post(webhook, { content })
      } catch (err) {
        console.error('[api/project-applications] Discord webhook failed:', err)
      }
    } else {
      console.warn('[api/project-applications] DISCORD_WEBHOOK_URL not set; skipping notification')
    }

    return NextResponse.json({ message: 'success', id: application.id })
  } catch (err) {
    console.error('[api/project-applications] Failed to save application:', err)
    return NextResponse.json(
      {
        message: err instanceof Error ? err.message : 'Failed to save application',
      },
      { status: 500 }
    )
  }
}
