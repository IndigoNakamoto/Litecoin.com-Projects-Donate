import { getAllPublishedProjects } from '@/services/cms/projects'
import ProjectsPageClient from '@/components/projects/ProjectsPageClient'
import { Suspense } from 'react'

export default async function ProjectsPage() {
  const projects = await getAllPublishedProjects()

  // ProjectsPageClient uses useSearchParams(), which requires a Suspense boundary in Next.js.
  return (
    <Suspense fallback={null}>
      <ProjectsPageClient projects={projects} />
    </Suspense>
  )
}
