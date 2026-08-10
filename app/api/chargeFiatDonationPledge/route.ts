import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'
import axios from 'axios'
import { databaseApiHeaders, getDatabaseApiUrl } from '@/lib/database-api'

type ChargeFiatDonationRequest = {
  pledgeId?: string
  cardToken?: string
}

export async function POST(request: NextRequest) {
  let body: ChargeFiatDonationRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const pledgeId = body?.pledgeId
  const cardToken = body?.cardToken

  if (!pledgeId || !cardToken) {
    return NextResponse.json(
      { error: 'Missing required fields: pledgeId, cardToken' },
      { status: 400 }
    )
  }

  try {
    const client = await createTGBClient()

    const chargeResponse = await client.post('/donation/fiat/charge', {
      pledgeId,
      cardToken,
    })

    const success = Boolean(chargeResponse?.data?.data?.success)

    // Parity with old project: update Donation.success by pledgeId
    const apiUrl = getDatabaseApiUrl()
    const updateResponse = await fetch(`${apiUrl}/api/donations/by-pledge-id/${pledgeId}`, {
      method: 'PATCH',
      headers: databaseApiHeaders(),
      body: JSON.stringify({ success: success || false }),
      signal: AbortSignal.timeout(10000),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error(`Failed to update donation: ${updateResponse.status} ${errorText}`)
      // Don't fail the request if update fails
    }

    return NextResponse.json({ success })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.data?.meta?.message ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to charge fiat donation pledge'

      // Parity with old project: best-effort mark donation as failed
      try {
        const apiUrl = getDatabaseApiUrl()
        await fetch(`${apiUrl}/api/donations/by-pledge-id/${pledgeId}`, {
          method: 'PATCH',
          headers: databaseApiHeaders(),
          body: JSON.stringify({ success: false }),
          signal: AbortSignal.timeout(10000),
        })
      } catch (dbErr) {
        console.error('Error updating donation failure status:', dbErr)
      }

      return NextResponse.json(
        { error: String(errorMessage) },
        { status: error.response?.status || 500 }
      )
    }

    // Parity with old project: best-effort mark donation as failed
    try {
      const apiUrl = getDatabaseApiUrl()
      await fetch(`${apiUrl}/api/donations/by-pledge-id/${pledgeId}`, {
        method: 'PATCH',
        headers: databaseApiHeaders(),
        body: JSON.stringify({ success: false }),
        signal: AbortSignal.timeout(10000),
      })
    } catch (dbErr) {
      console.error('Error updating donation failure status:', dbErr)
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to charge fiat donation pledge' },
      { status: 500 }
    )
  }
}


