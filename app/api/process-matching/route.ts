// app/api/process-matching/route.ts
// Manual trigger endpoint for the donation matching process

import { NextRequest, NextResponse } from 'next/server'
import { processDonationMatchingWithPayload } from '@/services/matching'

/**
 * POST /api/process-matching
 * Manually trigger the matching process
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
    const minDate = body.minDate ? new Date(body.minDate) : undefined

    // Validate minDate if provided
    if (body.minDate && minDate && isNaN(minDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid minDate format. Use ISO 8601 format (e.g., 2025-01-01T00:00:00Z)' },
        { status: 400 }
      )
    }

    console.log(`[Process Matching] Starting${dryRun ? ' (dry run)' : ''}`)
    
    const result = await processDonationMatchingWithPayload({ dryRun, minDate })

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Matching process completed',
      processed: result.processed,
      matched: result.matched,
      totalMatchedAmount: result.totalMatchedAmount,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
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
    const minDateStr = searchParams.get('minDate')
    const minDate = minDateStr ? new Date(minDateStr) : undefined

    // Validate minDate if provided
    if (minDateStr && minDate && isNaN(minDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid minDate format. Use ISO 8601 format (e.g., 2025-01-01)' },
        { status: 400 }
      )
    }

    console.log(`[Process Matching] Starting via GET${dryRun ? ' (dry run)' : ''}`)
    
    const result = await processDonationMatchingWithPayload({ dryRun, minDate })

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Matching process completed',
      dryRun,
      processed: result.processed,
      matched: result.matched,
      totalMatchedAmount: result.totalMatchedAmount,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
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
