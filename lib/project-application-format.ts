import type { Prisma } from '@prisma/client'

const DISCORD_CONTENT_MAX = 1900

export function asString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export function truncateField(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function openSourceLabel(v: unknown): string {
  if (v === 'yes') return 'Yes'
  if (v === 'no') return 'No'
  if (v === 'partially') return 'Partially'
  const t = asString(v)
  return t || '—'
}

/**
 * Discord webhook `content` (markdown). Hard-capped below 2000 chars.
 */
export function buildProjectApplicationDiscordContent(params: {
  submissionUrl: string
  projectName: string
  payload: Prisma.InputJsonValue
}): string {
  const root = params.payload as Record<string, unknown>
  const overview = (root?.project_overview as Record<string, unknown>) || {}
  const budget = (root?.project_budget as Record<string, unknown>) || {}
  const applicant = (root?.applicant_information as Record<string, unknown>) || {}

  const lines: string[] = [
    '**New project application**',
    params.submissionUrl,
    '',
    `**Project:** ${params.projectName}`,
    `**Applicant:** ${asString(applicant.your_name)}`,
    `**Email:** ${asString(applicant.email)}`,
    `**Lead contributor:** ${asString(applicant.is_lead_contributor)}`,
    `**Main focus:** ${asString(overview.main_focus)}`,
    `**Repository:** ${truncateField(asString(overview.project_repository), 120)}`,
    `**Open source:** ${openSourceLabel(overview.open_source)}`,
  ]

  const lic = asString(overview.open_source_license)
  if (lic) lines.push(`**License:** ${truncateField(lic, 80)}`)

  const partial = asString(overview.partially_open_source)
  if (partial) {
    lines.push(`**Partially open (detail):** ${truncateField(partial, 200)}`)
  }

  lines.push(
    `**Prior funding:** ${budget.received_funding === true ? 'Yes' : budget.received_funding === false ? 'No' : asString(budget.received_funding)}`
  )
  const priorDetails = asString(budget.prior_funding_details)
  if (priorDetails) {
    lines.push(`**Funding details:** ${truncateField(priorDetails, 150)}`)
  }

  lines.push(`**Proposed budget:** ${truncateField(asString(budget.proposed_budget), 280)}`)

  const desc = truncateField(asString(overview.project_description), 350)
  if (desc) {
    lines.push('', '**Description:**', desc)
  }

  const impact = truncateField(asString(overview.potential_impact), 280)
  if (impact) {
    lines.push('', '**Potential impact:**', impact)
  }

  const social = truncateField(asString(overview.social_media_links), 200)
  if (social) lines.push('', `**Social / links:** ${social}`)

  let content = lines.join('\n')
  if (content.length > DISCORD_CONTENT_MAX) {
    content = `${content.slice(0, DISCORD_CONTENT_MAX - 1)}…`
  }
  return content
}
