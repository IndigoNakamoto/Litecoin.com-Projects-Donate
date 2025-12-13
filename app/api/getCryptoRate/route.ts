import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const currency = searchParams.get('currency')

  if (!currency) {
    return NextResponse.json(
      { message: 'Currency code is required' },
      { status: 400 }
    )
  }

  try {
    const client = await createTGBClient()

    const response = await client.get('/crypto-to-usd-rate', {
      params: { currency },
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching crypto rate:', error)
    return NextResponse.json(
      {
        error: error.response?.data?.error || 'Internal Server Error',
      },
      { status: error.response?.status || 500 }
    )
  }
}






