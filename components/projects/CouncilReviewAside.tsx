function statusStyles(status: string): string {
  const s = status.toLowerCase()
  if (s === 'approved') return 'bg-emerald-200/90 text-emerald-950'
  if (s === 'rejected') return 'bg-red-200/90 text-red-950'
  return 'bg-amber-200/90 text-amber-950'
}

export default function CouncilReviewAside({
  applicationId,
  projectName,
  applicantEmail,
  status,
  createdAt,
}: {
  applicationId: string
  projectName: string
  applicantEmail: string
  status: string
  createdAt: Date
}) {
  const received = createdAt.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <aside className="top-32 mb-8 flex min-w-[20rem] flex-col space-y-4 rounded-md bg-[#dddddd] p-4 lg:sticky lg:max-w-[22rem] lg:flex-col lg:space-x-4 lg:space-y-0">
      <div className="relative aspect-video w-full min-h-[140px] overflow-hidden rounded-sm bg-[#c6d3d6]">
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <p className="font-space-grotesk text-xs font-semibold uppercase tracking-widest text-gray-700">
            Council review
          </p>
          <p className="mt-2 line-clamp-2 font-space-grotesk text-lg font-semibold leading-tight text-gray-900">
            {projectName}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Status</p>
        <p
          className={`mt-2 inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusStyles(status)}`}
        >
          {status}
        </p>

        <dl className="mt-6 space-y-4 text-sm text-gray-800">
          <div>
            <dt className="text-gray-600">Received</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{received}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Applicant email</dt>
            <dd className="mt-0.5 break-all font-medium text-gray-900">{applicantEmail || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Application ID</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-gray-900">{applicationId}</dd>
          </div>
        </dl>

        <p className="mt-6 border-t border-gray-400/40 pt-4 text-xs leading-relaxed text-gray-600">
          For Open Source Fund council use. This URL is not authenticated—share only inside trusted
          channels.
        </p>
      </div>
    </aside>
  )
}
