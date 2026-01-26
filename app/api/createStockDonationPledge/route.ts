import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'
import Decimal from 'decimal.js'

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

    // pledgeAmount is stock quantity; must be positive
    let parsedPledgeAmount: Decimal
    try {
      parsedPledgeAmount = new Decimal(pledgeAmount)
      if (parsedPledgeAmount.lte(0)) {
        throw new Error('Pledge amount must be greater than zero.')
      }
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || 'Pledge amount must be greater than zero.' },
        { status: 400 }
      )
    }

    // Parity with old project: create Donation record first (without donationUuid)
    const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
    const createResponse = await fetch(`${apiUrl}/api/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug,
        organizationId,
        donationType: 'stock',
        assetSymbol,
        assetDescription,
        pledgeAmount: parsedPledgeAmount.toString(),
        firstName: firstName || null,
        lastName: lastName || null,
        donorEmail: receiptEmail || null,
        taxReceipt: true,
        isAnonymous: false,
        joinMailingList: joinMailingList || false,
        socialX: socialX || null,
        socialFacebook: socialFacebook || null,
        socialLinkedIn: socialLinkedIn || null,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      throw new Error(`Failed to create donation: ${createResponse.status} ${errorText}`)
    }

    const { donation } = await createResponse.json()

    const client = await createTGBClient()

    const apiPayload = {
      organizationId: String(organizationId),
      assetSymbol,
      assetDescription,
      pledgeAmount: parsedPledgeAmount.toString(),
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

    // Parity with old project: update Donation with donationUuid
    const updateResponse = await fetch(`${apiUrl}/api/donations/${donation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donationUuid }),
      signal: AbortSignal.timeout(10000),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error(`Failed to update donation: ${updateResponse.status} ${errorText}`)
      // Don't fail the request if update fails - donation is already created
    }

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


