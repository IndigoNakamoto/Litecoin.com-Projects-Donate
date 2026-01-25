// app/api/process-matching/route.ts
// Manual trigger endpoint for the donation matching process
// Now uses database API instead of direct database access

import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/process-matching
 * Manually trigger the matching process via database API
 * 
 * Request body (optional):
 * {
 *   "dryRun": boolean,  // Preview changes without applying
 *   "minDate": string   // Only process donations after this date (ISO 8601)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse options from request body
    const body = await request.json().catch(() => ({})) as {
      dryRun?: boolean
      minDate?: string
    }
    
    const dryRun = body.dryRun === true
    const minDate = body.minDate

    // Validate minDate if provided
    if (minDate && new Date(minDate) && isNaN(new Date(minDate).getTime())) {
      return NextResponse.json(
        { error: 'Invalid minDate format. Use ISO 8601 format (e.g., 2025-01-01T00:00:00Z)' },
        { status: 400 }
      )
    }

    console.log(`[Process Matching] Calling database API${dryRun ? ' (dry run)' : ''}`)
    
    // Call database API
    const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
    const response = await fetch(`${apiUrl}/api/matching/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun, minDate }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API returned ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Process Matching] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process matching', 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/process-matching
 * Preview matching (dry run) via GET request for easy testing
 * 
 * Query params:
 * - dryRun: boolean (default: true for GET)
 * - minDate: string (ISO 8601 date)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    // Default to dry run for GET requests (safer for manual testing)
    const dryRun = searchParams.get('dryRun') !== 'false'
    const minDate = searchParams.get('minDate') || undefined

    // Validate minDate if provided
    if (minDate && new Date(minDate) && isNaN(new Date(minDate).getTime())) {
      return NextResponse.json(
        { error: 'Invalid minDate format. Use ISO 8601 format (e.g., 2025-01-01)' },
        { status: 400 }
      )
    }

    console.log(`[Process Matching] Calling database API via GET${dryRun ? ' (dry run)' : ''}`)
    
    // Call database API
    const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
    const response = await fetch(`${apiUrl}/api/matching/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun, minDate }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API returned ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Process Matching] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process matching', 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
