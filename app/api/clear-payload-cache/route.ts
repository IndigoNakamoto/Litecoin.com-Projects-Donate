import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'
import { createPayloadClient, fetchAllPages } from '@/services/payload/client'

/**
 * Clear Payload CMS cache
 * POST /api/clear-payload-cache
 */
export async function POST() {
  try {
    const clearedKeys: string[] = []

    // Clear main cache keys
    const mainCacheKeys = [
      'payload:projects:published',
      'payload:contributors:active',
    ]

    for (const key of mainCacheKeys) {
      try {
        const deleted = await kv.del(key)
        if (deleted > 0) {
          clearedKeys.push(key)
          console.log(`[clear-payload-cache] Cleared: ${key}`)
        }
      } catch (err) {
        console.warn(`[clear-payload-cache] Error clearing ${key}:`, err)
      }
    }

    // Fetch all projects from Payload to get their slugs and clear individual project caches
    try {
      const client = createPayloadClient()
      const payloadProjects = await fetchAllPages<{ slug: string }>(
        client,
        '/projects',
        {
          where: {
            hidden: {
              equals: false,
            },
          },
          limit: 100, // Get all projects
        }
      )

      // Clear individual project caches
      for (const project of payloadProjects) {
        const projectCacheKey = `payload:project:${project.slug}`
        try {
          const deleted = await kv.del(projectCacheKey)
          if (deleted > 0) {
            clearedKeys.push(projectCacheKey)
            console.log(`[clear-payload-cache] Cleared: ${projectCacheKey}`)
          }
        } catch (err) {
          // Key might not exist, continue
        }
      }

      console.log(`[clear-payload-cache] Processed ${payloadProjects.length} projects for cache clearing`)
    } catch (error) {
      console.warn('[clear-payload-cache] Error fetching projects to clear individual caches:', error)
      // Continue even if we can't fetch projects - we've already cleared the main cache
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedKeys.length} cache keys`,
      clearedKeys,
    })
  } catch (error) {
    console.error('[clear-payload-cache] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for convenience (same as POST)
 */
export async function GET() {
  return POST()
}
