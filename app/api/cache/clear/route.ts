import { NextResponse } from 'next/server'
import { kv } from '@/lib/kv'
import { usePayloadCMS } from '@/services/cms/config'

/**
 * API route to clear project-related caches
 * 
 * This is useful when:
 * - Project statuses have changed
 * - Projects have been updated in Webflow/Payload CMS
 * - Cache needs to be invalidated for testing
 * 
 * Usage:
 * - GET /api/cache/clear - Clears all project caches (prioritizes active CMS)
 * - GET /api/cache/clear?key=webflow:projects:published - Clears specific cache key
 * - GET /api/cache/clear?pattern=webflow:* - Clears all keys matching pattern
 * - GET /api/cache/clear?all=true - Clears all caches regardless of active CMS
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const pattern = searchParams.get('pattern')
    const all = searchParams.get('all') === 'true'
    
    const clearedKeys: string[] = []
    const usePayload = usePayloadCMS()
    
    // Known cache keys for projects - prioritize based on active CMS
    const knownProjectKeys = usePayload && !all
      ? [
          'payload:projects:published', // Payload CMS cache (active)
        ]
      : [
          'webflow:projects:published', // Webflow cache
          'webflow:projects:status-map', // Webflow status mapping
          'payload:projects:published', // Payload CMS cache (if switching)
        ]
    
    // Known cache key patterns - prioritize based on active CMS
    const knownPatterns = usePayload && !all
      ? [
          'payload:project:*', // Payload CMS individual project caches (active)
          'payload:projects:*', // Payload CMS project list caches (active)
        ]
      : [
          'webflow:project:*', // Webflow individual project caches
          'webflow:projects:*', // Webflow project list caches
          'webflow:schema:*', // Webflow schema caches
          'payload:project:*', // Payload CMS individual project caches (if switching)
          'payload:projects:*', // Payload CMS project list caches (if switching)
        ]
    
    if (key) {
      // Clear specific key
      try {
        await kv.del(key)
        clearedKeys.push(key)
        console.log(`[cache/clear] Cleared specific key: ${key}`)
      } catch (error) {
        console.error(`[cache/clear] Error clearing key ${key}:`, error)
        return NextResponse.json(
          { error: `Failed to clear key: ${key}`, details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    } else if (pattern) {
      // Clear keys matching pattern
      try {
        const keys = await kv.keys(pattern)
        for (const cacheKey of keys) {
          await kv.del(cacheKey)
          clearedKeys.push(cacheKey)
        }
        console.log(`[cache/clear] Cleared ${keys.length} keys matching pattern: ${pattern}`)
      } catch (error) {
        console.error(`[cache/clear] Error clearing pattern ${pattern}:`, error)
        return NextResponse.json(
          { error: `Failed to clear pattern: ${pattern}`, details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    } else {
      // Clear all known project cache keys
      for (const cacheKey of knownProjectKeys) {
        try {
          await kv.del(cacheKey)
          clearedKeys.push(cacheKey)
          console.log(`[cache/clear] Cleared key: ${cacheKey}`)
        } catch (error) {
          console.warn(`[cache/clear] Failed to clear key ${cacheKey}:`, error)
        }
      }
      
      // Clear keys matching known patterns
      for (const cachePattern of knownPatterns) {
        try {
          const keys = await kv.keys(cachePattern)
          for (const cacheKey of keys) {
            await kv.del(cacheKey)
            clearedKeys.push(cacheKey)
          }
          if (keys.length > 0) {
            console.log(`[cache/clear] Cleared ${keys.length} keys matching pattern: ${cachePattern}`)
          }
        } catch (error) {
          console.warn(`[cache/clear] Failed to clear pattern ${cachePattern}:`, error)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedKeys.length} cache key(s)`,
      clearedKeys,
      clearedCount: clearedKeys.length,
      activeCMS: usePayload ? 'Payload CMS' : 'Webflow',
      note: usePayload 
        ? 'Projects are being fetched from Payload CMS. Cleared Payload CMS caches.'
        : 'Projects are being fetched from Webflow. Cleared Webflow caches. Use ?all=true to clear all caches.',
    })
  } catch (error: unknown) {
    console.error('[cache/clear] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
