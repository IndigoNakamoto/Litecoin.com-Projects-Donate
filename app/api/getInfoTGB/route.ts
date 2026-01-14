import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'
import { prisma } from '@/lib/prisma'
import Decimal from 'decimal.js'

type SuccessResponse = {
  funded_txo_sum: number
  tx_count: number
  supporters: string[]
  donatedCreatedTime: {
    valueAtDonationTimeUSD: number
    createdTime: string
  }[]
}

type ErrorResponse = {
  message: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json(
      { message: 'Slug is required' },
      { status: 400 }
    )
  }

  try {
    const cacheKey = `tgb-info-${slug}`
    const cachedData = await kv.get<SuccessResponse>(cacheKey)

    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Try to use Donation model first (if it exists) for processed donations with USD values
    let donations: any[] = []
    let totalAmount = new Decimal(0)
    
    try {
      // @ts-ignore - Donation model may not exist in new schema
      const processedDonations = await prisma.donation.findMany({
        where: {
          projectSlug: slug,
          status: {
            in: ['Complete', 'Advanced'],
          },
          valueAtDonationTimeUSD: {
            gte: 2,
          },
        },
      })
      
      if (processedDonations && processedDonations.length > 0) {
        donations = processedDonations
        // Sum using valueAtDonationTimeUSD for precision
        totalAmount = processedDonations.reduce((acc: Decimal, donation: any) => {
          const donationAmount = donation.valueAtDonationTimeUSD
            ? new Decimal(donation.valueAtDonationTimeUSD.toString() || '0')
            : new Decimal(0)
          return acc.plus(donationAmount)
        }, new Decimal(0))
      }
    } catch (error) {
      // Donation model doesn't exist, fall back to DonationPledge
    }

    // If no processed donations found, fall back to DonationPledge (only if that table exists).
    if (donations.length === 0) {
      let pledges: any[] = []
      try {
        pledges = await prisma.donationPledge.findMany({
          where: {
            projectSlug: slug,
            // Only sum USD-denominated pledges or fiat donations (which are typically USD)
            OR: [
              { pledgeCurrency: { equals: 'USD', mode: 'insensitive' } },
              { donationType: 'fiat' },
            ],
          },
        })
      } catch (e: any) {
        // Old live DB may not have DonationPledge; treat as no donations.
        if (e?.code !== 'P2021') {
          throw e
        }
      }

      if (!pledges || pledges.length === 0) {
        return NextResponse.json(
          { message: 'No donations found for this slug.' },
          { status: 404 }
        )
      }

      donations = pledges
      // Sum using Decimal for precision
      totalAmount = pledges.reduce((acc: Decimal, donation: any) => {
        const donationAmount = donation.pledgeAmount
          ? new Decimal(donation.pledgeAmount.toString() || '0')
          : new Decimal(0)
        return acc.plus(donationAmount)
      }, new Decimal(0))
    }

    // Unified supporter list
    const supporters: string[] = []

    donations.forEach((donation) => {
      if (donation.socialX) {
        supporters.push(`${donation.socialX}`)
      }
    })

    // Donation amounts with creation timestamps
    const donatedCreatedTime = donations.map((donation) => {
      // Use valueAtDonationTimeUSD if available (from Donation model), otherwise use pledgeAmount
      const usdValue = donation.valueAtDonationTimeUSD
        ? parseFloat(donation.valueAtDonationTimeUSD.toString())
        : (donation.pledgeAmount ? parseFloat(donation.pledgeAmount.toString()) : 0)
      
      return {
        valueAtDonationTimeUSD: usdValue,
        createdTime: donation.createdAt.toISOString(),
      }
    })

    // Round to 2 decimal places to match display precision
    const fundedTxoSum = Math.round(totalAmount.toNumber() * 100) / 100
    
    const responseData: SuccessResponse = {
      funded_txo_sum: fundedTxoSum,
      tx_count: donations.length,
      supporters: supporters,
      donatedCreatedTime: donatedCreatedTime,
    }

    await kv.set(cacheKey, responseData, { ex: 900 }) // Cache for 15 minutes

    return NextResponse.json(responseData)
  } catch (err) {
    console.error('Error fetching donation info:', err)
    return NextResponse.json(
      { message: (err as Error).message },
      { status: 500 }
    )
  }
}

