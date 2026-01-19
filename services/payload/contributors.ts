import { kv } from '@/lib/kv'
import { createPayloadClient, fetchAllPages, resolvePayloadAssetUrl } from './client'
import type { PayloadContributor } from './types'
import type { Contributor } from '@/types/project'
import { toAppID } from './id'

const CACHE_TTL = 259200 // 3 days in seconds

/**
 * Transform Payload contributor to our Contributor type
 */
function transformContributor(payloadContributor: PayloadContributor): Contributor {
  const profilePicture = payloadContributor.profilePicture
  // Handle profilePicture - it can be an ID (number), object with url, or null/undefined
  let avatarUrl: string | undefined = undefined
  
  // More explicit handling of the profilePicture object
  if (profilePicture && typeof profilePicture === 'object' && !Array.isArray(profilePicture)) {
    // The actual Payload response has more fields than our type, so cast to any to access url
    const pictureObj = profilePicture as any
    if (pictureObj.url && typeof pictureObj.url === 'string') {
      avatarUrl = resolvePayloadAssetUrl(pictureObj.url)
    }
  } else if (typeof profilePicture === 'number') {
    // If it's just an ID, we'd need to fetch it, but this shouldn't happen with depth=2
    console.warn(`[transformContributor] Contributor ${payloadContributor.id} (${payloadContributor.name}) has profilePicture as ID (${profilePicture}), not populated. Need depth > 1 for nested media.`)
  }

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
 * Get all active contributors from Payload CMS
 */
export async function getAllActiveContributors(): Promise<Contributor[]> {
  const cacheKey = 'payload:contributors:active'
  let cached: Contributor[] | null = null

  // Try to get from cache
  try {
    cached = await kv.get<Contributor[]>(cacheKey)
    if (cached) {
      return cached
    }
  } catch (error) {
    // KV not available, continue
    console.warn('KV cache unavailable for contributors, fetching directly from Payload')
  }

  const client = createPayloadClient()
  // Explicitly pass depth=2 to ensure profilePicture is populated
  const payloadContributors = await fetchAllPages<PayloadContributor>(
    client,
    '/contributors',
    { depth: 2 }
  )

  // Transform to our Contributor type
  const contributors = payloadContributors.map(transformContributor)

  // Cache the results
  try {
    await kv.set(cacheKey, contributors, { ex: CACHE_TTL })
  } catch (error) {
    // KV not available, continue
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



