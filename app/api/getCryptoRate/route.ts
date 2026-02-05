import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'

type CachedRate = {
  data: any
  expiresAt: number
}

const RATE_TTL_MS = 60 * 1000
const rateCache = new Map<string, CachedRate>()
const inflightRequests = new Map<string, Promise<any>>()

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
    const cacheKey = currency.toLowerCase()
    const cached = rateCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': `public, s-maxage=${RATE_TTL_MS / 1000}, stale-while-revalidate=60`,
        },
      })
    }

    const existingRequest = inflightRequests.get(cacheKey)
    if (existingRequest) {
      const data = await existingRequest
      return NextResponse.json(data)
    }

    const requestPromise = (async () => {
      const client = await createTGBClient()
      const response = await client.get('/crypto-to-usd-rate', {
        params: { currency: cacheKey },
      })

      rateCache.set(cacheKey, {
        data: response.data,
        expiresAt: Date.now() + RATE_TTL_MS,
      })

      return response.data
    })()

    inflightRequests.set(cacheKey, requestPromise)
    const data = await requestPromise

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${RATE_TTL_MS / 1000}, stale-while-revalidate=60`,
      },
    })
  } catch (error: any) {
    console.error('Error fetching crypto rate:', error)
    return NextResponse.json(
      {
        error: error.response?.data?.error || 'Internal Server Error',
      },
      { status: error.response?.status || 500 }
    )
  } finally {
    if (currency) {
      inflightRequests.delete(currency.toLowerCase())
    }
  }
}










