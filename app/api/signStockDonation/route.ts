import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { donationUuid, date, signature } = body

    // Match legacy behavior: explicit missing-field errors
    if (!donationUuid) {
      return NextResponse.json({ error: 'Missing field: donationUuid' }, { status: 400 })
    }
    if (!date) {
      return NextResponse.json({ error: 'Missing field: date' }, { status: 400 })
    }
    if (!signature) {
      return NextResponse.json({ error: 'Missing field: signature' }, { status: 400 })
    }

    const client = await createTGBClient()

    // The Giving Block: submit signature for a stock donation pledge
    const response = await client.post('/stocks/sign', {
      donationUuid,
      date,
      signature,
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error signing stock donation:', error)
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


