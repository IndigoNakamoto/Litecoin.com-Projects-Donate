import { getProjectBySlug } from '@/services/cms/projects'
import { getFAQsByProjectSlug, type FAQItem } from '@/services/cms/faqs'
import { getPostsByProjectSlug, type Post } from '@/services/cms/posts'
import { getUpdatesByProjectSlug, type Update } from '@/services/cms/updates'
import { notFound } from 'next/navigation'
import ProjectDetailClient from '@/components/projects/ProjectDetailClient'
import { Suspense } from 'react'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Next.js 15+ params are always a Promise
  const resolvedParams = await params
  
  let project
  let faqs: FAQItem[] = []
  let updates: Update[] = []
  let posts: Post[] = []

  try {
    project = await getProjectBySlug(resolvedParams.slug)

    if (!project) {
      console.error(`[ProjectPage] Project "${resolvedParams.slug}" not found, calling notFound()`)
      notFound()
    }
    


    // Fetch FAQs, updates, and posts from APIs
    const [fetchedFaqs, fetchedUpdates, fetchedPosts] = await Promise.all([
      getFAQsByProjectSlug(resolvedParams.slug),
      getUpdatesByProjectSlug(resolvedParams.slug),
      getPostsByProjectSlug(resolvedParams.slug),
    ])

    faqs = fetchedFaqs
    updates = fetchedUpdates
    posts = fetchedPosts
  } catch (error) {
    console.error('[ProjectPage] Error rendering page:', error)
    if (error instanceof Error) {
      console.error('[ProjectPage] Error stack:', error.stack)
    }
    throw error // Re-throw to show error page
  }

  // TODO: Fetch address stats from APIs
  const addressStats = {
    tx_count: 0,
    funded_txo_sum: 0,
    supporters: [],
  }

  return (
    // ProjectDetailClient uses useSearchParams(), which requires a Suspense boundary in Next.js.
    <Suspense fallback={null}>
      <ProjectDetailClient
        project={project}
        addressStats={addressStats}
        faqs={faqs}
        updates={updates}
        posts={posts}
      />
    </Suspense>
  )
}

