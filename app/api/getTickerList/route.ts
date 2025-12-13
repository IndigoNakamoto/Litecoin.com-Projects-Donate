import { NextRequest, NextResponse } from 'next/server'
import { createTGBClient } from '@/services/tgb/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filters, pagination } = body

    if (!pagination) {
      return NextResponse.json(
        { error: 'Pagination is required' },
        { status: 400 }
      )
    }

    const { name, ticker } = filters || {}

    if (!name && !ticker) {
      return NextResponse.json(
        { error: 'Please provide a filter, either name or ticker.' },
        { status: 400 }
      )
    }

    const client = await createTGBClient()

    // Function to make requests to The Giving Block API
    const fetchTickers = async (filter: {
      name?: string
      ticker?: string
    }) => {
      return client.post('/stocks/tickers', {
        filters: filter,
        pagination: {
          page: pagination.page || 1,
          itemsPerPage: pagination.itemsPerPage || 50,
        },
      })
    }

    // If both name and ticker are provided, make separate requests
    const promises: Promise<any>[] = []
    if (name) {
      promises.push(fetchTickers({ name }))
    }

    if (ticker) {
      promises.push(fetchTickers({ ticker }))
    }

    // Execute both requests (if applicable)
    const results = await Promise.all(promises)

    // Combine results into a set to avoid duplicates
    const tickersSet = new Set<string>()
    const combinedTickers: { name: string; ticker: string }[] = []

    results.forEach((response) => {
      response.data.data.tickers.forEach((tickerObj: { name: string; ticker: string }) => {
        const uniqueKey = `${tickerObj.name}-${tickerObj.ticker}`
        if (!tickersSet.has(uniqueKey)) {
          tickersSet.add(uniqueKey)
          combinedTickers.push(tickerObj)
        }
      })
    })

    // Send the relevant data in the response
    return NextResponse.json({
      data: {
        tickers: combinedTickers,
        pagination: {
          count: combinedTickers.length, // Return the number of unique results
          page: pagination.page,
          itemsPerPage: pagination.itemsPerPage,
        },
      },
    })
  } catch (error: any) {
    console.error(
      'Error fetching ticker list:',
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






