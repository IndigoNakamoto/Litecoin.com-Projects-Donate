import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      organizationId,
      projectSlug,
      assetSymbol,
      assetDescription,
      pledgeAmount,
      receiptEmail,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      zipcode,
      phoneNumber,
      isAnonymous,
      joinMailingList,
      socialX,
      socialFacebook,
      socialLinkedIn,
    } = body

    // Validate required fields (PersonalInfo step for stock always provides these)
    const missingFields: string[] = []
    if (organizationId === undefined || organizationId === null)
      missingFields.push('organizationId')
    if (!projectSlug) missingFields.push('projectSlug')
    if (!assetSymbol) missingFields.push('assetSymbol')
    if (!assetDescription) missingFields.push('assetDescription')
    if (!pledgeAmount) missingFields.push('pledgeAmount')
    if (!receiptEmail) missingFields.push('receiptEmail')
    if (!firstName) missingFields.push('firstName')
    if (!lastName) missingFields.push('lastName')
    if (!addressLine1) missingFields.push('addressLine1')
    if (!country) missingFields.push('country')
    if (!city) missingFields.push('city')
    if (!zipcode) missingFields.push('zipcode')
    if (!phoneNumber) missingFields.push('phoneNumber')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // pledgeAmount is stock quantity; must be a positive integer-ish
    const parsedPledgeAmount = Number(pledgeAmount)
    if (!Number.isFinite(parsedPledgeAmount) || parsedPledgeAmount <= 0) {
      return NextResponse.json(
        { error: 'Pledge amount must be greater than zero.' },
        { status: 400 }
      )
    }

    const client = await createTGBClient()

    const apiPayload = {
      organizationId: String(organizationId),
      assetSymbol,
      assetDescription,
      pledgeAmount: String(pledgeAmount),
      receiptEmail,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      zipcode,
      phoneNumber,
    }

    // Call The Giving Block: Create Stock Donation Pledge
    const response = await client.post('/donation/stocks', apiPayload)

    const donationUuid = response?.data?.data?.donationUuid
    if (!donationUuid) {
      return NextResponse.json(
        { error: 'Invalid response from external API.' },
        { status: 500 }
      )
    }

    // Include extra fields in response for potential client usage/debugging
    return NextResponse.json({ donationUuid })
  } catch (error: any) {
    console.error('Error creating stock donation pledge:', error)
    return NextResponse.json(
      {
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'Internal Server Error',
      },
      { status: error.response?.status || 500 }
    )
  }
}


