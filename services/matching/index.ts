// services/matching/index.ts
// Matching service that uses Payload CMS instead of Webflow

import { prisma } from '@/lib/prisma'
import { createPayloadClient, fetchAllPages } from '@/services/payload/client'
import type { PayloadProject, PayloadResponse } from '@/services/payload/types'

/**
 * Payload CMS Matching Donor type
 */
export interface PayloadMatchingDonor {
  id: number
  webflowId: string | null
  name: string
  matchingType: 'all-projects' | 'per-project'
  totalMatchingAmount: number
  supportedProjects?: Array<number | PayloadProject>
  startDate: string
  endDate: string
  multiplier: number
  status: 'active' | 'inactive'
  contributor?: number | { id: number; name: string }
  createdAt: string
  updatedAt: string
}

/**
 * Matching donor with remaining amount calculated
 */
export interface MatchingDonorWithRemaining extends PayloadMatchingDonor {
  remainingAmount: number
  supportedProjectSlugs: string[]
}

/**
 * Result of the matching process
 */
export interface MatchingResult {
  processed: number
  matched: number
  totalMatchedAmount: number
  errors: string[]
}

/**
 * Fetch active matching donors from Payload CMS
 */
export async function getActiveMatchingDonorsFromPayload(): Promise<PayloadMatchingDonor[]> {
  const client = createPayloadClient()
  
  try {
    // Fetch all active matching donors with depth=2 to populate relationships
    const donors = await fetchAllPages<PayloadMatchingDonor>(
      client,
      '/matching-donors',
      {
        'where[status][equals]': 'active',
        depth: 2,
      }
    )
    
    const now = new Date()
    
    // Filter by date range
    return donors.filter((donor) => {
      const startDate = new Date(donor.startDate)
      const endDate = new Date(donor.endDate)
      return now >= startDate && now <= endDate
    })
  } catch (error) {
    console.error('Error fetching matching donors from Payload CMS:', error)
    throw error
  }
}

/**
 * Get already matched amounts for multiple donors
 * Returns a Map of donorId -> total matched amount
 */
export async function getDonorsMatchedAmounts(donorIds: string[]): Promise<Map<string, number>> {
  const matchedAmounts = await prisma.matchingDonationLog.groupBy({
    by: ['donorId'],
    where: {
      donorId: { in: donorIds },
    },
    _sum: {
      matchedAmount: true,
    },
  })

  const donorMatchedAmountMap = new Map<string, number>()
  matchedAmounts.forEach((item) => {
    const matchedAmount = item._sum.matchedAmount?.toNumber() || 0
    donorMatchedAmountMap.set(item.donorId, matchedAmount)
  })

  return donorMatchedAmountMap
}

/**
 * Get project slugs for a matching donor
 */
function getSupportedProjectSlugs(donor: PayloadMatchingDonor): string[] {
  if (!donor.supportedProjects || donor.supportedProjects.length === 0) {
    return []
  }
  
  return donor.supportedProjects
    .map((project) => {
      if (typeof project === 'number') {
        // Project not populated, skip
        return null
      }
      return project.slug
    })
    .filter((slug): slug is string => slug !== null)
}

/**
 * Main matching process using Payload CMS
 */
export async function processDonationMatchingWithPayload(options?: {
  dryRun?: boolean
  minDate?: Date
}): Promise<MatchingResult> {
  const { dryRun = false, minDate } = options || {}
  const errors: string[] = []
  
  console.log('Starting processDonationMatching with Payload CMS')
  console.log(`  Dry run: ${dryRun}`)
  
  // Build where clause for donations query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = { processed: false }
  if (minDate) {
    whereClause.createdAt = { gte: minDate }
    console.log(`  Only processing donations after: ${minDate.toISOString()}`)
  }
  
  // Get unprocessed donations
  const donations = await prisma.donation.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' },
  })
  
  console.log(`Found ${donations.length} unprocessed donations`)
  
  if (donations.length === 0) {
    return { processed: 0, matched: 0, totalMatchedAmount: 0, errors }
  }

  // Get active matching donors from Payload CMS
  const matchingDonors = await getActiveMatchingDonorsFromPayload()
  console.log(`Found ${matchingDonors.length} active matching donors in Payload CMS`)

  if (matchingDonors.length === 0) {
    console.log('No active matching donors, marking donations as processed')
    
    // Mark all donations as processed since there's nothing to match
    if (!dryRun) {
      for (const donation of donations) {
        await prisma.donation.update({
          where: { id: donation.id },
          data: { processed: true },
        })
      }
    }
    
    return { processed: donations.length, matched: 0, totalMatchedAmount: 0, errors }
  }

  // Get donor IDs - use Payload ID as string, or webflowId if available for backward compatibility
  const donorIds = matchingDonors.map((d) => d.webflowId || d.id.toString())
  
  // Get already matched amounts
  const donorMatchedAmountMap = await getDonorsMatchedAmounts(donorIds)
  console.log('Current matched amounts:', Object.fromEntries(donorMatchedAmountMap))

  let matchedCount = 0
  let totalMatchedAmount = 0

  for (const donation of donations) {
    try {
      const donationAmount = Number(donation.valueAtDonationTimeUSD)
      
      if (isNaN(donationAmount) || donationAmount <= 0) {
        console.warn(`Donation ID ${donation.id} has invalid amount (${donationAmount}), skipping matching but not marking as processed`)
        continue
      }

      const projectSlug = donation.projectSlug
      console.log(`Processing donation ID ${donation.id}, amount: $${donationAmount.toFixed(2)}, project: ${projectSlug}`)

      // Find eligible donors for this project
      const eligibleDonors = matchingDonors.filter((donor) => {
        if (donor.matchingType === 'all-projects') {
          return true
        }
        // Per-project matching - check if project is in supported list
        const supportedSlugs = getSupportedProjectSlugs(donor)
        return supportedSlugs.includes(projectSlug)
      })

      console.log(`  Found ${eligibleDonors.length} eligible donors`)

      let remainingDonationAmount = donationAmount

      for (const donor of eligibleDonors) {
        // Use webflowId for backward compatibility, otherwise use Payload ID
        const donorId = donor.webflowId || donor.id.toString()
        const totalMatchingAmount = donor.totalMatchingAmount
        const alreadyMatchedAmount = donorMatchedAmountMap.get(donorId) || 0
        const remainingMatchingAmount = totalMatchingAmount - alreadyMatchedAmount

        console.log(`  Donor ${donor.name} (${donorId}): total=${totalMatchingAmount}, matched=${alreadyMatchedAmount}, remaining=${remainingMatchingAmount}`)

        if (remainingMatchingAmount <= 0) {
          console.log(`    No remaining matching amount, skipping`)
          continue
        }

        const multiplier = donor.multiplier || 1
        if (multiplier === 0) {
          console.warn(`    Donor has multiplier of 0, skipping`)
          continue
        }
        
        const maxMatchableAmount = remainingMatchingAmount / multiplier
        const matchAmount = Math.min(remainingDonationAmount, maxMatchableAmount)

        if (matchAmount <= 0) {
          console.log(`    Cannot match (maxMatchable: ${maxMatchableAmount}), skipping`)
          continue
        }

        const matchedValue = matchAmount * multiplier
        console.log(`    Matching $${matchedValue.toFixed(2)} (${multiplier}x multiplier on $${matchAmount.toFixed(2)})`)

        if (!dryRun) {
          await prisma.matchingDonationLog.create({
            data: {
              donorId,
              donationId: donation.id,
              matchedAmount: matchedValue,
              date: new Date(),
              projectSlug,
            },
          })
        }

        // Update in-memory tracking
        donorMatchedAmountMap.set(donorId, alreadyMatchedAmount + matchedValue)
        remainingDonationAmount -= matchAmount
        matchedCount++
        totalMatchedAmount += matchedValue

        if (remainingDonationAmount <= 0) {
          console.log(`    Donation fully matched`)
          break
        }
      }

      // Mark donation as processed
      if (!dryRun) {
        await prisma.donation.update({
          where: { id: donation.id },
          data: { processed: true },
        })
        console.log(`  Donation ID ${donation.id} marked as processed`)
      }
    } catch (error) {
      const errorMsg = `Error processing donation ID ${donation.id}: ${error}`
      console.error(errorMsg)
      errors.push(errorMsg)
    }
  }

  console.log(`\nMatching complete:`)
  console.log(`  Donations processed: ${donations.length}`)
  console.log(`  Matches created: ${matchedCount}`)
  console.log(`  Total matched: $${totalMatchedAmount.toFixed(2)}`)
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`)
  }

  return { 
    processed: donations.length, 
    matched: matchedCount, 
    totalMatchedAmount,
    errors,
  }
}

/**
 * Get matching donors for a specific project (for display purposes)
 */
export async function getMatchingDonorsForProject(projectSlug: string): Promise<Array<{
  donorId: string
  donorName: string
  totalMatchedAmount: number
}>> {
  // Get all matching log entries for this project
  const matchingLogs = await prisma.matchingDonationLog.findMany({
    where: { projectSlug },
    select: { donorId: true },
    distinct: ['donorId'],
  })

  const donorIds = matchingLogs.map((log) => log.donorId)
  
  if (donorIds.length === 0) {
    return []
  }

  // Get total matched amounts per donor for this project
  const matchedAmounts = await prisma.matchingDonationLog.groupBy({
    by: ['donorId'],
    where: { projectSlug },
    _sum: { matchedAmount: true },
  })

  // Fetch donor details from Payload CMS
  const client = createPayloadClient()
  const donors = await fetchAllPages<PayloadMatchingDonor>(
    client,
    '/matching-donors',
    { depth: 0 }
  )

  // Build result - match by Payload ID or webflowId
  const result: Array<{
    donorId: string
    donorName: string
    totalMatchedAmount: number
  }> = []

  for (const { donorId, _sum } of matchedAmounts) {
    const donor = donors.find(
      (d) => d.id.toString() === donorId || d.webflowId === donorId
    )
    
    result.push({
      donorId,
      donorName: donor?.name || 'Unknown Donor',
      totalMatchedAmount: _sum.matchedAmount?.toNumber() || 0,
    })
  }

  return result
}
