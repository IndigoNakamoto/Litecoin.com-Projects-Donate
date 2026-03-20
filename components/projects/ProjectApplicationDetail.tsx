import type { ReactNode } from 'react'
import { asString } from '@/lib/project-application-format'

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-md bg-[#c6d3d6] p-6 shadow-sm">
      <h2 className="mb-1 border-b border-black/10 pb-3 font-space-grotesk text-xl font-semibold text-gray-900">
        {title}
      </h2>
      <div className="divide-y divide-black/5">{children}</div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  const v = value.trim()
  if (!v) return null
  return (
    <div className="py-4 first:pt-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-700">{label}</dt>
      <dd className="mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-gray-900">{v}</dd>
    </div>
  )
}

function openSourceDisplay(overview: Record<string, unknown>): string {
  const os = overview.open_source
  if (os === 'yes') {
    const lic = asString(overview.open_source_license)
    return lic ? `Yes (${lic})` : 'Yes'
  }
  if (os === 'no') return 'No'
  if (os === 'partially') {
    const p = asString(overview.partially_open_source)
    return p ? `Partially — ${p}` : 'Partially'
  }
  return asString(os) || '—'
}

export default function ProjectApplicationDetail({ payload }: { payload: unknown }) {
  const root =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
  const overview = (root.project_overview as Record<string, unknown>) || {}
  const budget = (root.project_budget as Record<string, unknown>) || {}
  const applicant = (root.applicant_information as Record<string, unknown>) || {}

  const priorFunding =
    budget.received_funding === true
      ? asString(budget.prior_funding_details) || 'Yes'
      : budget.received_funding === false
        ? 'No'
        : asString(budget.received_funding)

  const leadLine = (() => {
    if (applicant.is_lead_contributor === true) return 'Yes (submitter is lead)'
    if (applicant.is_lead_contributor === false) {
      const other = asString(applicant.other_lead)
      return other ? `No — lead: ${other}` : 'No'
    }
    return asString(applicant.is_lead_contributor)
  })()

  return (
    <div className="w-full pb-8">
      <div className="markdown mb-8">
        <h2 className="font-space-grotesk text-gray-900">Application record</h2>
        <p className="max-w-3xl text-lg font-medium text-gray-800">
          Full submission as received from the applicant. Use this alongside your council process.
        </p>
      </div>

      <SectionCard title="Project overview">
        <Field label="Project name" value={asString(overview.project_name)} />
        <Field label="Description" value={asString(overview.project_description)} />
        <Field label="Main focus" value={asString(overview.main_focus)} />
        <Field label="Potential impact" value={asString(overview.potential_impact)} />
        <Field label="Repository" value={asString(overview.project_repository)} />
        <Field label="Social / media links" value={asString(overview.social_media_links)} />
        <Field label="Open source" value={openSourceDisplay(overview)} />
      </SectionCard>

      <SectionCard title="Project budget">
        <Field label="Proposed budget" value={asString(budget.proposed_budget)} />
        <Field label="Prior funding" value={priorFunding} />
        {budget.received_funding === true ? (
          <Field label="Prior funding details" value={asString(budget.prior_funding_details)} />
        ) : null}
      </SectionCard>

      <SectionCard title="Applicant">
        <Field label="Name" value={asString(applicant.your_name)} />
        <Field label="Email" value={asString(applicant.email)} />
        <Field label="Project lead / lead contributor" value={leadLine} />
        <Field label="Personal GitHub" value={asString(applicant.personal_github)} />
        <Field label="Other contact" value={asString(applicant.other_contact_details)} />
        <Field label="Prior contributions" value={asString(applicant.prior_contributions)} />
        <Field label="References" value={asString(applicant.references)} />
      </SectionCard>
    </div>
  )
}
