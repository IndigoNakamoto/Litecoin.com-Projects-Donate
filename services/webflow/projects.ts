import { kv } from '@/lib/kv'
import { createWebflowClient, listCollectionItems } from './client'
import type { WebflowProject } from './types'
import type { Project, ProjectSummary, Contributor } from '@/types/project'
import { getContributorsByIds } from './contributors'

const CACHE_TTL = 259200 // 3 days in seconds

// Cache for status ID to label mapping
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let statusLabelMap: { [key: string]: string } | null = null
const STATUS_MAP_CACHE_KEY = 'webflow:projects:status-map'
const SCHEMA_CACHE_KEY_PREFIX = 'webflow:schema:'

interface CollectionSchemaField {
  id: string
  slug: string
  type: string
  displayName: string
  validations?: {
    options?: Array<{
      id: string
      name: string
    }>
  }
}

interface CollectionSchema {
  id: string
  displayName: string
  fields: CollectionSchemaField[]
}

/**
 * Get the collection schema from Webflow API with caching
 * Returns null if rate limited and no cache is available (allows graceful degradation)
 */
async function getCollectionSchema(
  client: ReturnType<typeof createWebflowClient>,
  collectionId: string
): Promise<CollectionSchema | null> {
  const cacheKey = `${SCHEMA_CACHE_KEY_PREFIX}${collectionId}`
  
  // Try to get from cache first
  try {
    const cached = await kv.get<CollectionSchema>(cacheKey)
    if (cached) {
      return cached
    }
  } catch {
    // KV not available, continue
  }

  try {
    const response = await client.get<CollectionSchema>(
      `/collections/${collectionId}`
    )
    
    // Cache the schema
    try {
      await kv.set(cacheKey, response.data, { ex: CACHE_TTL })
    } catch {
      // KV not available, continue
    }
    
    return response.data
  } catch (error: unknown) {
    // If we get a 429 (rate limit), try to use cached data if available
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string }
    if (axiosError.response?.status === 429) {
      console.warn(
        `Rate limited (429) when fetching schema for ${collectionId}, trying cached data...`
      )
      try {
        const cached = await kv.get<CollectionSchema>(cacheKey)
        if (cached) {
          return cached
        }
      } catch {
        // Cache not available
      }
      console.warn(
        `Rate limited and no cached schema available for ${collectionId}. Will use status IDs as-is.`
      )
      // Return null to allow graceful degradation
      return null
    }
    
    const errorMessage = axiosError.response?.data || axiosError.message || 'Unknown error'
    console.warn(
      `Error fetching collection schema for ${collectionId}:`,
      errorMessage,
      '- Will use status IDs as-is'
    )
    // Return null instead of throwing to allow graceful degradation
    return null
  }
}

/**
 * Create a mapping from status option IDs to their labels
 */
async function createStatusLabelMap(
  client: ReturnType<typeof createWebflowClient>,
  collectionId: string
): Promise<{ [key: string]: string }> {
  // Try to get from cache first
  try {
    const cached = await kv.get<{ [key: string]: string }>(STATUS_MAP_CACHE_KEY)
    if (cached) {
      statusLabelMap = cached
      return cached
    }
  } catch {
    // Cache not available, continue
  }

  try {
    const schema = await getCollectionSchema(client, collectionId)
    
    // If schema is null (rate limited or error), return empty map to allow graceful degradation
    if (!schema) {
      console.warn('Schema not available, returning empty status map. Status IDs will be used as-is.')
      const emptyMap: { [key: string]: string } = {}
      statusLabelMap = emptyMap
      return emptyMap
    }
    
    const statusField = schema.fields.find((f) => f.slug === 'status')

    if (!statusField) {
      console.warn('Status field not found in collection schema, returning empty map')
      const emptyMap: { [key: string]: string } = {}
      statusLabelMap = emptyMap
      return emptyMap
    }

    if (!statusField.validations || !statusField.validations.options) {
      console.warn('Status field is not an Option field, returning empty map')
      const emptyMap: { [key: string]: string } = {}
      statusLabelMap = emptyMap
      return emptyMap
    }

    const map: { [key: string]: string } = {}
    statusField.validations.options.forEach((option) => {
      map[option.id] = option.name.trim()
    })

    statusLabelMap = map

    // Cache the mapping
    try {
      await kv.set(STATUS_MAP_CACHE_KEY, map, { ex: CACHE_TTL })
    } catch {
      // Cache not available, continue
    }

    return map
  } catch (error: unknown) {
    // If we get any error, try to use cached status map if available
    const axiosError = error as { response?: { status?: number }; message?: string }
    console.warn(
      `Error creating status map, trying cached data...`,
      axiosError.response?.status || axiosError.message
    )
    try {
      const cached = await kv.get<{ [key: string]: string }>(STATUS_MAP_CACHE_KEY)
      if (cached) {
        statusLabelMap = cached
        return cached
      }
    } catch {
      // Cache not available
    }
    
    // If no cached data available, return empty map to allow graceful degradation
    console.warn('No cached status map available, returning empty map. Status IDs will be used as-is.')
    const emptyMap: { [key: string]: string } = {}
    statusLabelMap = emptyMap
    return emptyMap
  }
}


export async function getAllPublishedProjects(): Promise<Project[]> {
  const apiToken = process.env.WEBFLOW_API_TOKEN
  const collectionId = process.env.WEBFLOW_COLLECTION_ID_PROJECTS

  if (!apiToken || !collectionId) {
    throw new Error('Webflow API credentials not configured')
  }

  const client = createWebflowClient(apiToken)
  
  // Get status label mapping first (needed for both cached and fresh data)
  const statusMap = await createStatusLabelMap(client, collectionId)
  
  const cacheKey = 'webflow:projects:published'
  let cached: Project[] | null = null
  
  // Check if force refresh is enabled
  const forceRefresh = process.env.FORCE_REFRESH_WEBFLOW === 'true'
  
  if (forceRefresh) {
    console.log('[webflow:getAllPublishedProjects] FORCE_REFRESH_WEBFLOW=true, skipping cache')
    // Clear the cache when forcing refresh
    try {
      await kv.del(cacheKey)
      console.log('[webflow:getAllPublishedProjects] Cleared cache')
    } catch {
      // KV not available, continue
    }
  } else {
    // Try to get from cache, but don't fail if KV is not configured
    try {
      cached = await kv.get<Project[]>(cacheKey)
      // If we have cached data, ensure status labels are mapped (in case cache has old IDs)
      if (cached) {
        // Check if any project has a status that looks like an ID (long alphanumeric string)
        // If so, re-map the statuses
        const needsRemapping = cached.some(p => p.status && p.status.length > 20 && !p.status.includes(' '))
        if (needsRemapping) {
          cached = cached.map(p => ({
            ...p,
            status: statusMap[p.status] || p.status
          }))
        }
        return cached
      }
    } catch {
      // KV not configured or unavailable, continue without cache
      console.warn('KV cache unavailable, fetching directly from Webflow')
    }
  }
  
  const allProjects = await listCollectionItems<WebflowProject>(
    client,
    collectionId
  )

  // Filter to only published and non-hidden projects
  const publishedProjects = allProjects.filter(
    (project) => 
      !project.isDraft && 
      !project.isArchived &&
      !project.fieldData.hidden // Also filter out hidden projects at the source
  )

  // Transform to our Project type, mapping status IDs to labels
  const projects: Project[] = publishedProjects.map((project) => {
    const statusId = project.fieldData.status
    const statusLabel = statusMap[statusId] || statusId // Use label if available, fallback to ID
    
    return {
      id: project.id,
      name: project.fieldData.name,
      slug: project.fieldData.slug,
      summary: project.fieldData.summary,
      content: project.fieldData.content,
      coverImage: project.fieldData['cover-image']?.url,
      status: statusLabel, // Use the mapped label instead of the ID
      projectType: project.fieldData['project-type'],
      hidden: project.fieldData.hidden,
      recurring: project.fieldData.recurring,
      totalPaid: project.fieldData['total-paid'],
      serviceFeesCollected: project.fieldData['service-fees-collected'],
      website: project.fieldData['website-link'],
      github: project.fieldData['github-link'],
      twitter: project.fieldData['twitter-link'],
      discord: project.fieldData['discord-link'],
      telegram: project.fieldData['telegram-link'],
      reddit: project.fieldData['reddit-link'],
      facebook: project.fieldData['facebook-link'],
      lastPublished: project.lastPublished,
      lastUpdated: project.lastUpdated,
      createdOn: project.createdOn,
    }
  })

  // Cache the results (if KV is available)
  try {
    await kv.set(cacheKey, projects, { ex: CACHE_TTL })
  } catch {
    // KV not configured or unavailable, continue without caching
    console.warn('KV cache unavailable, skipping cache write')
  }

  return projects
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const apiToken = process.env.WEBFLOW_API_TOKEN
  const collectionId = process.env.WEBFLOW_COLLECTION_ID_PROJECTS

  if (!apiToken || !collectionId) {
    console.error('[getProjectBySlug] Webflow API credentials not configured')
    throw new Error('Webflow API credentials not configured')
  }

  const client = createWebflowClient(apiToken)
  
  // Get status label mapping
  const statusMap = await createStatusLabelMap(client, collectionId)
  
  // Try to get from cache first (but skip cache for debugging)
  const cacheKey = `webflow:project:${slug}`
  try {
    const cached = await kv.get<Project>(cacheKey)
    if (cached) {
      // For now, skip cache to ensure fresh data
      // TODO: Re-enable cache after debugging
      // return cached
    }
  } catch {
    // KV not available, continue
  }

  const project = await fetchProjectWithContributors(client, collectionId, slug, statusMap)
  
  if (project) {
    // Cache the result
    try {
      await kv.set(cacheKey, project, { ex: CACHE_TTL })
    } catch {
      // KV not available, continue
    }
  } else {
    console.warn(`[getProjectBySlug] Project "${slug}" not found`)
  }

  return project
}

async function fetchProjectWithContributors(
  client: ReturnType<typeof createWebflowClient>,
  collectionId: string,
  slug: string,
  statusMap: { [key: string]: string }
): Promise<Project | null> {
  try {
    // Fetch all projects and find the one with matching slug
    const allProjects = await listCollectionItems<WebflowProject>(
      client,
      collectionId
    )

    const webflowProject = allProjects.find((p) => p.fieldData.slug === slug && !p.isDraft && !p.isArchived)

    if (!webflowProject) {
      // Check if project exists but is draft/archived
      const draftOrArchived = allProjects.find((p) => p.fieldData.slug === slug)
      if (draftOrArchived) {
        console.warn(`[fetchProjectWithContributors] Project "${slug}" found but is draft: ${draftOrArchived.isDraft}, archived: ${draftOrArchived.isArchived}`)
      } else {
        console.warn(`[fetchProjectWithContributors] Project "${slug}" not found in ${allProjects.length} projects`)
        // List all slugs for debugging
        const allSlugs = allProjects.map(p => p.fieldData.slug).join(', ')
        console.warn(`[fetchProjectWithContributors] All available slugs: ${allSlugs}`)
      }
      return null
    }

    const statusId = webflowProject.fieldData.status
    const statusLabel = statusMap[statusId] || statusId

    // Fetch contributors
    // Try both field name variations for compatibility
    const fieldData = webflowProject.fieldData as unknown as Record<string, string[] | undefined>
    const bitcoinContributorIds = 
      fieldData['bitcoin-contributors-2'] || 
      fieldData['bitcoin-contributors'] || 
      []
    const litecoinContributorIds = 
      fieldData['litecoin-contributors-2'] || 
      fieldData['litecoin-contributors'] || 
      []
    const advocateIds = 
      fieldData['advocates-2'] || 
      fieldData.advocates || 
      []
    
    let bitcoinContributors: Contributor[] = []
    let litecoinContributors: Contributor[] = []
    let advocates: Contributor[] = []
    
    try {
      [bitcoinContributors, litecoinContributors, advocates] = await Promise.all([
        getContributorsByIds(bitcoinContributorIds),
        getContributorsByIds(litecoinContributorIds),
        getContributorsByIds(advocateIds),
      ])
    } catch (contributorError: unknown) {
      const errorMessage = contributorError instanceof Error ? contributorError.message : 'Unknown error'
      console.warn(`[fetchProjectWithContributors] Error fetching contributors (continuing anyway):`, errorMessage)
      // Continue without contributors rather than failing the whole request
    }

    const project: Project = {
      id: webflowProject.id,
      name: webflowProject.fieldData.name,
      slug: webflowProject.fieldData.slug,
      summary: webflowProject.fieldData.summary,
      content: webflowProject.fieldData.content,
      coverImage: webflowProject.fieldData['cover-image']?.url,
      status: statusLabel,
      projectType: webflowProject.fieldData['project-type'],
      hidden: webflowProject.fieldData.hidden,
      recurring: webflowProject.fieldData.recurring,
      totalPaid: webflowProject.fieldData['total-paid'],
      serviceFeesCollected: webflowProject.fieldData['service-fees-collected'],
      website: webflowProject.fieldData['website-link'],
      github: webflowProject.fieldData['github-link'],
      twitter: webflowProject.fieldData['twitter-link'],
      discord: webflowProject.fieldData['discord-link'],
      telegram: webflowProject.fieldData['telegram-link'],
      reddit: webflowProject.fieldData['reddit-link'],
      facebook: webflowProject.fieldData['facebook-link'],
      lastPublished: webflowProject.lastPublished,
      lastUpdated: webflowProject.lastUpdated,
      createdOn: webflowProject.createdOn,
      bitcoinContributors: bitcoinContributors.length > 0 ? bitcoinContributors : undefined,
      litecoinContributors: litecoinContributors.length > 0 ? litecoinContributors : undefined,
      advocates: advocates.length > 0 ? advocates : undefined,
      litecoinRaised: webflowProject.fieldData['litecoin-raised'],
      litecoinPaid: webflowProject.fieldData['litecoin-paid'],
    }

    return project
  } catch (error: unknown) {
    console.error(`[fetchProjectWithContributors] Error fetching project "${slug}":`, error)
    if (error instanceof Error) {
      console.error(`[fetchProjectWithContributors] Error details:`, error.message, error.stack)
    }
    throw error
  }
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
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

