import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

/**
 * POST /api/clearKV
 * Clear KV cache keys
 * 
 * Called by Vercel cron jobs every 12 hours (schedule: 0 *\/12 * * *)
 * Also supports manual calls with authentication
 */
export async function POST(request: NextRequest) {
  // Authenticate the request using Authorization header (if CRON_SECRET is set)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret) {
    const expectedAuthHeader = `Bearer ${cronSecret}`
    if (authHeader !== expectedAuthHeader) {
      console.log(`[clearKV] Unauthorized access attempt at ${new Date().toISOString()}`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  const clearedKeys: string[] = []

  try {
    // Clear specific known cache keys
    const knownKeys = [
      'contributors:all',
      'stats:all',
      'stats:totalPaid2',
      'projects:all',
      'payload:projects:published',
      'webflow:projects:published',
      'webflow:projects:status-map',
    ]

    for (const key of knownKeys) {
      try {
        await kv.del(key)
        clearedKeys.push(key)
        console.log(`[clearKV] Cleared '${key}' KV cache at ${new Date().toISOString()}`)
      } catch (error) {
        console.warn(`[clearKV] Failed to clear key ${key}:`, error)
      }
    }

    // Use pattern matching to find and clear all project-related cache keys
    const patterns = ['project:*', 'tgb-info-*', 'matching-donors-*', 'payload:project:*', 'payload:projects:*', 'webflow:project:*', 'webflow:projects:*', 'webflow:schema:*']

    for (const pattern of patterns) {
      try {
        const keys = await kv.keys(pattern)
        console.log(
          `[clearKV] Found ${keys.length} keys matching pattern: ${pattern} at ${new Date().toISOString()}`
        )
        for (const key of keys) {
          await kv.del(key)
          clearedKeys.push(key)
          console.log(`[clearKV] Cleared cache: ${key}`)
        }
      } catch (error) {
        console.warn(`[clearKV] Failed to clear pattern ${pattern}:`, error)
      }
    }

    // Note: We don't call res.revalidate() here because:
    // 1. It can cause 404s if CMS API is temporarily unavailable during revalidation
    // 2. Pages have ISR with revalidate: 600, so they'll regenerate naturally
    // 3. The next request to each page will trigger regeneration with fresh cache
    // 4. This prevents the race condition where cache is cleared but revalidation fails

    console.log(
      `[clearKV] Cache clearing completed at ${new Date().toISOString()}. Cleared ${clearedKeys.length} keys. Pages will regenerate naturally via ISR on next request.`
    )

    return NextResponse.json({
      message: `Cleared ${clearedKeys.length} cache keys successfully. Pages will regenerate via ISR on next request.`,
      clearedKeysCount: clearedKeys.length,
      clearedKeys,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error(`[clearKV] Error clearing cache at ${new Date().toISOString()}:`, error)
    return NextResponse.json(
      {
        error: 'Failed to clear cache.',
        details: err.message || 'An unexpected error occurred.',
        clearedKeysCount: clearedKeys.length,
      },
      { status: 500 }
    )
  }
}

