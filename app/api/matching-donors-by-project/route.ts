// app/api/matching-donors-by-project/route.ts
// Returns matching donors who have matched donations for a specific project
// Supports both Payload CMS and Webflow (legacy) as data sources

import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'
import { prisma } from '@/lib/prisma'
import { createWebflowClient, listCollectionItems } from '@/services/webflow/client'
import { createPayloadClient, fetchAllPages } from '@/services/payload/client'
import type { PayloadMatchingDonor } from '@/services/matching'

// Webflow matching donor interface (legacy)
interface WebflowMatchingDonor {
  id: string
  fieldData: {
    name?: string
    status?: string
    'matching-type'?: string
    'supported-projects'?: string[]
    [key: string]: unknown
  }
}

// Unified response format
interface MatchingDonorResponse {
  donorId: string
  donorName: string
  donorFieldData?: Record<string, unknown>
  totalMatchedAmount: number
}

/**
 * Check if Payload CMS should be used
 */
function usePayloadCMS(): boolean {
  const usePayload = process.env.USE_PAYLOAD_CMS?.trim().toLowerCase()
  return usePayload === 'true' || usePayload === '1' || usePayload === 'yes' || usePayload === 'on'
}

/**
 * Fetch matching donors from Payload CMS
 */
async function getMatchingDonorsFromPayload(
  donorIds: string[],
  totalMatchedAmountMap: Record<string, number>
): Promise<MatchingDonorResponse[]> {
  const client = createPayloadClient()
  
  // Fetch all matching donors from Payload
  const allDonors = await fetchAllPages<PayloadMatchingDonor>(
    client,
    '/matching-donors',
    { depth: 0 }
  )

  // Filter to donors who have matched this project
  // Match by either Payload ID or webflowId for backward compatibility
  const result: MatchingDonorResponse[] = []
  
  for (const donorId of donorIds) {
    const donor = allDonors.find(
      (d) => d.id.toString() === donorId || d.webflowId === donorId
    )
    
    if (donor) {
      result.push({
        donorId,
        donorName: donor.name,
        donorFieldData: {
          name: donor.name,
          status: donor.status,
          'matching-type': donor.matchingType,
          multiplier: donor.multiplier,
          'total-matching-amount': donor.totalMatchingAmount,
        },
        totalMatchedAmount: totalMatchedAmountMap[donorId] || 0,
      })
    } else {
      // Donor not found in Payload, but we have matching logs
      result.push({
        donorId,
        donorName: 'Unknown Donor',
        totalMatchedAmount: totalMatchedAmountMap[donorId] || 0,
      })
    }
  }

  return result
}

/**
 * Fetch matching donors from Webflow (legacy)
 */
async function getMatchingDonorsFromWebflow(
  donorIds: string[],
  totalMatchedAmountMap: Record<string, number>
): Promise<MatchingDonorResponse[]> {
  const apiToken = process.env.WEBFLOW_API_TOKEN
  const collectionId = process.env.WEBFLOW_COLLECTION_ID_MATCHING_DONORS

  if (!apiToken || !collectionId) {
    console.warn('[Matching Donors] Webflow API credentials not configured')
    return donorIds.map((donorId) => ({
      donorId,
      donorName: 'Unknown Donor',
      totalMatchedAmount: totalMatchedAmountMap[donorId] || 0,
    }))
  }

  const client = createWebflowClient(apiToken)
  const allDonors = await listCollectionItems<WebflowMatchingDonor>(client, collectionId)

  // Filter to donors who have matched this project
  const result: MatchingDonorResponse[] = []
  
  for (const donorId of donorIds) {
    const donor = allDonors.find((d) => d.id === donorId)
    
    if (donor) {
      result.push({
        donorId,
        donorName: donor.fieldData.name || 'Unknown Donor',
        donorFieldData: donor.fieldData,
        totalMatchedAmount: totalMatchedAmountMap[donorId] || 0,
      })
    } else {
      result.push({
        donorId,
        donorName: 'Unknown Donor',
        totalMatchedAmount: totalMatchedAmountMap[donorId] || 0,
      })
    }
  }

  return result
}

/**
 * GET /api/matching-donors-by-project?slug=<project-slug>
 * Returns all matching donors who have matched donations for the specified project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Project slug is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `matching-donors-${slug}`
    try {
      const cachedData = await kv.get(cacheKey)
      if (cachedData) {
        return NextResponse.json(cachedData)
      }
    } catch {
      // KV might not be available, continue without cache
    }

    // Get all donor IDs who have matched donations for this project
    let matchingDonations: { donorId: string }[] = []
    try {
      matchingDonations = await prisma.matchingDonationLog.findMany({
        where: {
          projectSlug: slug,
        },
        select: {
          donorId: true,
        },
        distinct: ['donorId'],
      })
    } catch (error) {
      console.warn('[Matching Donors] Error querying MatchingDonationLog:', error)
      return NextResponse.json([])
    }

    const donorIds = matchingDonations.map((d) => d.donorId)

    if (donorIds.length === 0) {
      return NextResponse.json([])
    }

    // Get total matched amounts per donor for this project
    const totalMatchedAmounts = await prisma.matchingDonationLog.groupBy({
      by: ['donorId'],
      where: {
        projectSlug: slug,
      },
      _sum: {
        matchedAmount: true,
      },
    }).catch((error) => {
      console.warn('[Matching Donors] Error grouping matched amounts:', error)
      return []
    })

    // Build map of donorId -> total matched amount
    const totalMatchedAmountMap: Record<string, number> = {}
    for (const item of totalMatchedAmounts) {
      const amount = item._sum.matchedAmount?.toNumber() ?? 0
      totalMatchedAmountMap[item.donorId] = Math.round(amount * 100) / 100
    }

    // Fetch donor details from appropriate source
    let result: MatchingDonorResponse[]
    
    if (usePayloadCMS()) {
      console.log('[Matching Donors] Using Payload CMS')
      result = await getMatchingDonorsFromPayload(donorIds, totalMatchedAmountMap)
    } else {
      console.log('[Matching Donors] Using Webflow (legacy)')
      result = await getMatchingDonorsFromWebflow(donorIds, totalMatchedAmountMap)
    }

    // Cache the result
    try {
      await kv.set(cacheKey, result, { ex: 900 }) // 15 minutes
    } catch {
      // KV might not be available, continue without caching
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Matching Donors] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matching donors' },
      { status: 500 }
    )
  }
}
