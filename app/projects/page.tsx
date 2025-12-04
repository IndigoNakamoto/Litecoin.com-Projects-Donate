import { getAllPublishedProjects } from '@/services/webflow/projects'
import ProjectsPageClient from '@/components/projects/ProjectsPageClient'

export default async function ProjectsPage() {
  const projects = await getAllPublishedProjects()

  return <ProjectsPageClient projects={projects} />
}
