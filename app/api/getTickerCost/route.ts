import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json(
      { error: 'Ticker symbol is required' },
      { status: 400 }
    )
  }

  try {
    const client = await createTGBClient()

    const response = await client.get('/stocks/ticker-cost', {
      params: { ticker },
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error(
      'Error fetching ticker cost:',
      error.response?.data || error.message
    )
    return NextResponse.json(
      {
        error: error.response?.data?.error || error.message || 'Internal Server Error',
      },
      { status: error.response?.status || 500 }
    )
  }
}






