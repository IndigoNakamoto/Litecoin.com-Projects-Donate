import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProjectHeader from '@/components/projects/ProjectHeader'
import ProjectApplicationDetail from '@/components/projects/ProjectApplicationDetail'
import CouncilReviewAside from '@/components/projects/CouncilReviewAside'
import { prisma } from '@/lib/prisma'

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
      title: 'Litecoin.com | Application not found',
      robots: { index: false, follow: false },
    }
  }
  return {
    title: `Litecoin.com | Council review — ${row.projectName}`,
    description: 'Open Source Fund council review of a project application.',
    robots: { index: false, follow: false },
  }
}

export default async function CouncilApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
