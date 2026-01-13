import { NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'

export async function GET() {
  try {
    const client = await createTGBClient()

    // The Giving Block: list supported stock brokers
    // Legacy endpoint returned the upstream response body as-is (expects data.brokers on client)
    const response = await client.get('/stocks/brokers')

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching brokers:', error)
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






