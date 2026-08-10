import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPublicSiteOrigin, submissionDetailPath } from '@/lib/public-site-url'
import { getProjectsWebhookUrl, postDiscordWebhook } from '@/lib/discord'

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
 * Persists project submission to PostgreSQL and notifies Discord
 * (#litecoin-projects-server via DISCORD_PROJECTS_WEBHOOK_URL, else DISCORD_WEBHOOK_URL).
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

    const webhook = getProjectsWebhookUrl()
    if (webhook) {
      const origin = getPublicSiteOrigin(request)
      const submissionUrl = `${origin}${submissionDetailPath(application.id)}`
      await postDiscordWebhook(webhook, {
        embeds: [
          {
            title: 'New project application',
            color: 0x345d9d,
            fields: [
              { name: 'Project', value: application.projectName, inline: false },
              { name: 'Review', value: submissionUrl, inline: false },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      })
    } else {
      console.warn(
        '[api/project-applications] DISCORD_PROJECTS_WEBHOOK_URL / DISCORD_WEBHOOK_URL not set; skipping notification'
      )
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
