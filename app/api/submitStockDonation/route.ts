import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      donationUuid,
      brokerName,
      brokerageAccountNumber,
      brokerContactName,
      brokerEmail,
      brokerPhone,
    } = body

    const missingFields: string[] = []
    if (!donationUuid) missingFields.push('donationUuid')
    if (!brokerName) missingFields.push('brokerName')
    if (!brokerageAccountNumber) missingFields.push('brokerageAccountNumber')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const client = await createTGBClient()

    // The Giving Block: submit broker details for an existing stock donation pledge
    const response = await client.post('/stocks/submit', {
      donationUuid,
      brokerName,
      brokerageAccountNumber,
      brokerContactName,
      brokerEmail,
      brokerPhone,
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error submitting stock donation:', error)
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


