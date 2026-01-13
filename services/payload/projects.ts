import { kv } from '@/lib/kv'
import { createPayloadClient, fetchAllPages, resolvePayloadAssetUrl } from './client'
import type { PayloadProject, PayloadContributor } from './types'
import type { Project, Contributor } from '@/types/project'
import { getContributorsByIds } from './contributors'
import { toAppID } from './id'

const CACHE_TTL = 259200 // 3 days in seconds

/**
 * Transform Payload contributor to our Contributor type
 */
function transformContributor(payloadContributor: PayloadContributor): Contributor {
  const coverImage = payloadContributor.profilePicture
  const avatarUrl = resolvePayloadAssetUrl(
    typeof coverImage === 'object' && coverImage ? coverImage.url : undefined
  )

  return {
    id: toAppID(payloadContributor.id),
    name: payloadContributor.name,
    slug: payloadContributor.slug,
    avatar: avatarUrl,
    twitterLink: payloadContributor.twitterLink,
    discordLink: payloadContributor.discordLink,
    githubLink: payloadContributor.githubLink,
    youtubeLink: payloadContributor.youtubeLink,
    linkedinLink: payloadContributor.linkedinLink,
    email: payloadContributor.email,
  }
}

/**
 * Transform Payload project to our Project type
 */
async function transformProject(
  payloadProject: PayloadProject,
  resolveContributors: boolean = true
): Promise<Project> {
  const coverImage = payloadProject.coverImage
  const coverImageUrl = resolvePayloadAssetUrl(
    typeof coverImage === 'object' && coverImage ? coverImage.url : undefined
  )

  let bitcoinContributors: Contributor[] | undefined
  let litecoinContributors: Contributor[] | undefined
  let advocates: Contributor[] | undefined

  if (resolveContributors) {
    // Resolve contributor relationships
    const bitcoinIds = Array.isArray(payloadProject.bitcoinContributors)
      ? payloadProject.bitcoinContributors
          .filter((c): c is number => typeof c === 'number')
          .map(toAppID)
      : []
    
    const litecoinIds = Array.isArray(payloadProject.litecoinContributors)
      ? payloadProject.litecoinContributors
          .filter((c): c is number => typeof c === 'number')
          .map(toAppID)
      : []
    
    const advocateIds = Array.isArray(payloadProject.advocates)
      ? payloadProject.advocates
          .filter((c): c is number => typeof c === 'number')
          .map(toAppID)
      : []

    // If contributors are already populated, use them directly
    if (payloadProject.bitcoinContributors && 
        payloadProject.bitcoinContributors.length > 0 &&
        typeof payloadProject.bitcoinContributors[0] !== 'number') {
      bitcoinContributors = (payloadProject.bitcoinContributors as PayloadContributor[])
        .map(transformContributor)
    } else if (bitcoinIds.length > 0) {
      bitcoinContributors = await getContributorsByIds(bitcoinIds)
    }

    if (payloadProject.litecoinContributors && 
        payloadProject.litecoinContributors.length > 0 &&
        typeof payloadProject.litecoinContributors[0] !== 'number') {
      litecoinContributors = (payloadProject.litecoinContributors as PayloadContributor[])
        .map(transformContributor)
    } else if (litecoinIds.length > 0) {
      litecoinContributors = await getContributorsByIds(litecoinIds)
    }

    if (payloadProject.advocates && 
        payloadProject.advocates.length > 0 &&
        typeof payloadProject.advocates[0] !== 'number') {
      advocates = (payloadProject.advocates as PayloadContributor[])
        .map(transformContributor)
    } else if (advocateIds.length > 0) {
      advocates = await getContributorsByIds(advocateIds)
    }
  }

  return {
    id: toAppID(payloadProject.id),
    name: payloadProject.name,
    slug: payloadProject.slug,
    summary: payloadProject.summary,
    content: typeof payloadProject.content === 'string'
      ? payloadProject.content
      : JSON.stringify(payloadProject.content),
    coverImage: coverImageUrl,
    status: payloadProject.status,
    projectType: payloadProject.projectType,
    hidden: payloadProject.hidden,
    recurring: payloadProject.recurring,
    totalPaid: payloadProject.totalPaid,
    serviceFeesCollected: payloadProject.serviceFeesCollected,
    website: payloadProject.website,
    github: payloadProject.github,
    twitter: payloadProject.twitter,
    discord: payloadProject.discord,
    telegram: payloadProject.telegram,
    reddit: payloadProject.reddit,
    facebook: payloadProject.facebook,
    lastPublished: payloadProject.updatedAt,
    lastUpdated: payloadProject.updatedAt,
    createdOn: payloadProject.createdAt,
    bitcoinContributors: bitcoinContributors && bitcoinContributors.length > 0 
      ? bitcoinContributors 
      : undefined,
    litecoinContributors: litecoinContributors && litecoinContributors.length > 0 
      ? litecoinContributors 
      : undefined,
    advocates: advocates && advocates.length > 0 
      ? advocates 
      : undefined,
  }
}

/**
 * Get all published (non-hidden) projects from Payload CMS
 */
export async function getAllPublishedProjects(): Promise<Project[]> {
  const client = createPayloadClient()
  
  const cacheKey = 'payload:projects:published'
  let cached: Project[] | null = null
  
  // Try to get from cache
  try {
    cached = await kv.get<Project[]>(cacheKey)
    if (cached) {
      // If any cached slugs look like Webflow IDs (24-hex), refresh. This happens if
      // an older migration incorrectly stored `slug` as the Webflow item ID.
      const hasLegacySlug = cached.some((p) => /^[0-9a-f]{24}$/i.test(p.slug))
      const hasRelativeMedia = cached.some((p) => typeof p.coverImage === 'string' && p.coverImage.startsWith('/'))
      if (!hasLegacySlug && !hasRelativeMedia) return cached
      console.warn('[payload:getAllPublishedProjects] Detected legacy cache (slug/media); refreshing')
    }
  } catch (error) {
    // KV not available, continue
    console.warn('KV cache unavailable, fetching directly from Payload')
  }

  // Fetch all projects with contributors populated
  const payloadProjects = await fetchAllPages<PayloadProject>(
    client,
    '/projects',
    {
      where: {
        hidden: {
          equals: false,
        },
      },
      // Populate relationships
      depth: 1,
    }
  )

  // Transform to our Project type
  const projects = await Promise.all(
    payloadProjects.map((p) => transformProject(p, true))
  )

  // Cache the results
  try {
    await kv.set(cacheKey, projects, { ex: CACHE_TTL })
  } catch (error) {
    // KV not available, continue
    console.warn('KV cache unavailable, skipping cache write')
  }

  return projects
}

/**
 * Get a project by slug from Payload CMS
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const client = createPayloadClient()
  
  // Try to get from cache first
  const cacheKey = `payload:project:${slug}`
  try {
    const cached = await kv.get<Project>(cacheKey)
    if (cached) {
      return cached
    }
  } catch (error) {
    // KV not available, continue
  }

  try {
    // Fetch project by slug with contributors populated
    const response = await client.get('/projects', {
      params: {
        where: {
          slug: {
            equals: slug,
          },
          hidden: {
            equals: false,
          },
        },
        depth: 1, // Populate relationships
        limit: 1,
      },
    })

    const { docs } = response.data

    if (!docs || docs.length === 0) {
      console.warn(`[getProjectBySlug] Project "${slug}" not found`)
      return null
    }

    const payloadProject = docs[0] as PayloadProject
    const project = await transformProject(payloadProject, true)

    // Cache the result
    try {
      await kv.set(cacheKey, project, { ex: CACHE_TTL })
    } catch (error) {
      // KV not available, continue
    }

    return project
  } catch (error: unknown) {
    console.error(`[getProjectBySlug] Error fetching project "${slug}":`, error)
    if (error instanceof Error) {
      console.error(`[getProjectBySlug] Error details:`, error.message, error.stack)
    }
    throw error
  }
}

/**
 * Get project summaries (lightweight version)
 */
export async function getProjectSummaries(): Promise<Array<{
  id: string
  name: string
  slug: string
  summary: string
  coverImage?: string
  status: string
  projectType?: string
  totalPaid: number
}>> {
  const projects = await getAllPublishedProjects()
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    summary: project.summary,
    coverImage: project.coverImage,
    status: project.status,
    projectType: project.projectType,
    totalPaid: project.totalPaid,
  }))
}



