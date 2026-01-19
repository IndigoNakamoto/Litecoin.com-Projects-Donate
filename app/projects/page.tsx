import { getAllPublishedProjects } from '@/services/cms/projects'
import ProjectsPageClient from '@/components/projects/ProjectsPageClient'
import { Suspense } from 'react'

// Force dynamic rendering to avoid stale cache for project statuses
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectsPage() {
  const projects = await getAllPublishedProjects()

  // ProjectsPageClient uses useSearchParams(), which requires a Suspense boundary in Next.js.
  return (
    <Suspense fallback={null}>
      <ProjectsPageClient projects={projects} />
    </Suspense>
  )
}
