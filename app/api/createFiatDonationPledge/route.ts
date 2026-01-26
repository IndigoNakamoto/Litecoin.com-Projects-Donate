import { NextRequest, NextResponse } from 'next/server'
import Decimal from 'decimal.js'
import { createTGBClient } from '@/services/tgb/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      organizationId,
      projectSlug,
      pledgeCurrency,
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
      taxReceipt,
      isAnonymous,
      joinMailingList,
      socialX,
      socialFacebook,
      socialLinkedIn,
    } = body

    // Validate required fields
    const missingFields: string[] = []
    if (!organizationId) missingFields.push('organizationId')
    if (!pledgeCurrency) missingFields.push('pledgeCurrency')
    if (!pledgeAmount) missingFields.push('pledgeAmount')
    if (!projectSlug) missingFields.push('projectSlug')

    // If donation is not anonymous, validate additional fields
    if (isAnonymous === false) {
      if (!firstName) missingFields.push('firstName')
      if (!lastName) missingFields.push('lastName')
      if (!addressLine1) missingFields.push('addressLine1')
      if (!country) missingFields.push('country')
      if (!state) missingFields.push('state')
      if (!city) missingFields.push('city')
      if (!zipcode) missingFields.push('zipcode')
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate pledgeAmount
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

    // Parity with old project: create Donation record first (without pledgeId)
    const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
    const createResponse = await fetch(`${apiUrl}/api/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug,
        organizationId,
        donationType: 'fiat',
        assetSymbol: pledgeCurrency,
        pledgeAmount: parsedPledgeAmount.toString(),
        firstName: firstName || null,
        lastName: lastName || null,
        donorEmail: receiptEmail || null,
        isAnonymous: isAnonymous || false,
        taxReceipt: taxReceipt || false,
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

    // Prepare the payload for The Giving Block's CreateFiatDonationPledge API
    const apiPayload: any = {
      organizationId: organizationId.toString(),
      isAnonymous: isAnonymous || false,
      pledgeAmount: parsedPledgeAmount.toString(),
      firstName: firstName || ' ',
      lastName: lastName || ' ',
      receiptEmail: receiptEmail || ' ',
      addressLine1: addressLine1 || ' ',
      addressLine2: addressLine2 || ' ',
      country: country || ' ',
      state: state || ' ',
      city: city || ' ',
      zipcode: zipcode || ' ',
    }

    // Call The Giving Block's CreateFiatDonationPledge API
    const response = await client.post('/donation/fiat', apiPayload)

    // Check if the response has the expected data
    if (
      !response.data ||
      !response.data.data ||
      !response.data.data.pledgeId
    ) {
      return NextResponse.json(
        { error: 'Invalid response from external API.' },
        { status: 500 }
      )
    }

    const { pledgeId } = response.data.data

    // Parity with old project: update Donation with returned pledgeId
    const updateResponse = await fetch(`${apiUrl}/api/donations/${donation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pledgeId }),
      signal: AbortSignal.timeout(10000),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error(`Failed to update donation: ${updateResponse.status} ${errorText}`)
      // Don't fail the request if update fails - donation is already created
    }

    return NextResponse.json({ pledgeId })
  } catch (error: any) {
    console.error('Error creating fiat donation pledge:', error)
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






