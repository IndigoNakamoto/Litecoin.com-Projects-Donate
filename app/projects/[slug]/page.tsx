import { getProjectBySlug } from '@/services/webflow/projects'
import { notFound } from 'next/navigation'
import ProjectDetailClient from '@/components/projects/ProjectDetailClient'

export default async function ProjectPage({
  params,
}: {
  params: { slug: string }
}) {
  const project = await getProjectBySlug(params.slug)

  if (!project) {
    notFound()
  }

  // TODO: Fetch address stats, FAQs, updates, and posts from APIs
  const addressStats = {
    tx_count: 0,
    funded_txo_sum: 0,
    supporters: [],
  }
  const faqs: any[] = []
  const updates: any[] = []
  const posts: any[] = []

  return (
    <ProjectDetailClient
      project={project}
      addressStats={addressStats}
      faqs={faqs}
      updates={updates}
      posts={posts}
    />
  )
}

