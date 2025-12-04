import { kv } from '@/lib/kv'
import { createWebflowClient, listCollectionItems } from './client'
import type { Contributor } from '@/types/project'

const CACHE_TTL = 259200 // 3 days in seconds

interface WebflowContributor {
  id: string
  name?: string
  slug: string
  isDraft: boolean
  isArchived: boolean
  fieldData: {
    name?: string
    'profile-picture'?: {
      fileId: string
      url: string
      alt: string | null
    }
    'twitter-link'?: string
    'discord-link'?: string
    'github-link'?: string
    'youtube-link'?: string
    'linkedin-link'?: string
    email?: string
  }
}

/**
 * Get all active contributors from Webflow
 */
export async function getAllActiveContributors(): Promise<Contributor[]> {
  const apiToken = process.env.WEBFLOW_API_TOKEN
  const collectionId = process.env.WEBFLOW_COLLECTION_ID_CONTRIBUTORS

  if (!apiToken || !collectionId) {
    console.warn('Webflow API credentials not configured for contributors')
    return []
  }

  const cacheKey = 'webflow:contributors:active'
  let cached: Contributor[] | null = null

  // Try to get from cache
  try {
    cached = await kv.get<Contributor[]>(cacheKey)
    if (cached) {
      return cached
    }
  } catch (error) {
    // KV not configured or unavailable, continue without cache
    console.warn('KV cache unavailable for contributors, fetching directly from Webflow')
  }

  const client = createWebflowClient(apiToken)
  const allContributors = await listCollectionItems<WebflowContributor>(
    client,
    collectionId
  )

  // Filter to only active (non-draft, non-archived) contributors
  const activeContributors = allContributors.filter(
    (contributor) => !contributor.isDraft && !contributor.isArchived
  )

  // Debug: Log first contributor to see structure
  if (activeContributors.length > 0) {
    console.log('Sample contributor from Webflow:', JSON.stringify(activeContributors[0], null, 2))
  }

  // Transform to our Contributor type
  const contributors: Contributor[] = activeContributors.map((contributor) => {
    // Name is in fieldData (like projects), but check top-level as fallback
    const name = contributor.fieldData.name || contributor.name || 'Unknown Contributor'
    
    // Debug: Log if name is missing
    if (!name || name === 'Unknown Contributor') {
      console.warn('Contributor missing name:', {
        id: contributor.id,
        slug: contributor.slug,
        hasTopLevelName: !!contributor.name,
        hasFieldDataName: !!contributor.fieldData.name,
        fieldDataKeys: Object.keys(contributor.fieldData),
      })
    }
    
    return {
      id: contributor.id,
      name: name,
      slug: contributor.slug,
      avatar: contributor.fieldData['profile-picture']?.url,
      twitterLink: contributor.fieldData['twitter-link'],
      discordLink: contributor.fieldData['discord-link'],
      githubLink: contributor.fieldData['github-link'],
      youtubeLink: contributor.fieldData['youtube-link'],
      linkedinLink: contributor.fieldData['linkedin-link'],
      email: contributor.fieldData.email,
    }
  })

  // Cache the results (if KV is available)
  try {
    await kv.set(cacheKey, contributors, { ex: CACHE_TTL })
  } catch (error) {
    // KV not configured or unavailable, continue without caching
    console.warn('KV cache unavailable, skipping cache write for contributors')
  }

  return contributors
}

/**
 * Get contributors by their IDs
 */
export async function getContributorsByIds(
  contributorIds: string[]
): Promise<Contributor[]> {
  if (!contributorIds || contributorIds.length === 0) {
    return []
  }

  const allContributors = await getAllActiveContributors()
  return allContributors.filter((contributor) =>
    contributorIds.includes(contributor.id)
  )
}

