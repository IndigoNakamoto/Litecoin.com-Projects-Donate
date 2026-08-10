import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import ProjectHeader from '@/components/projects/ProjectHeader'
import ProjectApplicationDetail from '@/components/projects/ProjectApplicationDetail'
import CouncilReviewAside from '@/components/projects/CouncilReviewAside'
import { prisma } from '@/lib/prisma'
import { isCouncilAuthorized } from '@/lib/council-auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const row = await prisma.projectApplication.findUnique({
    where: { id },
    select: { projectName: true },
  })
  if (!row) {
    return {
      title: 'Litecoin | Application not found',
      robots: { index: false, follow: false },
    }
  }
  return {
    title: `Litecoin | Council review — ${row.projectName}`,
    description: 'Open Source Fund council review of a project application.',
    robots: { index: false, follow: false },
  }
}

function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2] p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Unauthorized</h1>
        <p className="mt-3 text-sm text-gray-600">
          This council review URL requires a valid access token. Open the link
          shared through trusted channels (it includes a token query parameter).
        </p>
      </div>
    </div>
  )
}

export default async function CouncilApplicationReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization')

  if (!isCouncilAuthorized(token, authHeader)) {
    return <Unauthorized />
  }

  const application = await prisma.projectApplication.findUnique({
    where: { id },
  })
  if (!application) {
    notFound()
  }

  const summaryParts = [
    'Open Source Fund council review',
    `Status: ${application.status}`,
    `Received ${application.createdAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`,
  ]
  const headerSummary = summaryParts.join(' · ')

  return (
    <div className="flex h-full w-screen max-w-none items-center bg-[#f2f2f2] bg-cover bg-center pb-8">
      <article className="relative mx-auto mt-32 flex min-h-screen w-[1300px] max-w-[90%] flex-col-reverse pb-16 lg:flex-row lg:items-start">
        <div className="content w-full leading-relaxed text-gray-800 lg:mr-5">
          <ProjectHeader title={application.projectName} summary={headerSummary} />
          <ProjectApplicationDetail payload={application.payload} />
        </div>

        <CouncilReviewAside
          applicationId={application.id}
          projectName={application.projectName}
          applicantEmail={application.applicantEmail}
          status={application.status}
          createdAt={application.createdAt}
        />
      </article>
    </div>
  )
}
