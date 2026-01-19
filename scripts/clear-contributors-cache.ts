/**
 * Script to clear contributors cache
 * 
 * Usage:
 *   cd litecoin-fund
 *   npx tsx scripts/clear-contributors-cache.ts
 */

import { kv } from '../lib/kv'

const CACHE_KEYS = [
  'payload:contributors:active',
  'webflow:contributors:active',
  'contributors:all',
]

async function clearContributorsCache() {
  console.log('🗑️  Clearing contributors cache...\n')

  const clearedKeys: string[] = []

  for (const key of CACHE_KEYS) {
    try {
      const deleted = await kv.del(key)
      if (deleted > 0) {
        clearedKeys.push(key)
        console.log(`  ✓ Cleared: ${key}`)
      }
    } catch (error) {
      // Key might not exist or KV not configured
      console.log(`  ⚠️  Could not clear ${key}:`, error instanceof Error ? error.message : 'KV not configured')
    }
  }

  // Also try pattern matching for any contributor-related cache keys
  try {
    const patterns = ['*contributors*', 'payload:contributors*', 'webflow:contributors*']
    for (const pattern of patterns) {
      try {
        const keys = await kv.keys(pattern)
        for (const key of keys) {
          await kv.del(key)
          clearedKeys.push(key)
          console.log(`  ✓ Cleared (pattern): ${key}`)
        }
      } catch (error) {
        // Pattern matching might not be supported
      }
    }
  } catch (error) {
    // Pattern matching not available
  }

  console.log(`\n✅ Contributors cache clear complete!`)
  console.log(`   Total keys cleared: ${clearedKeys.length}`)
  
  if (clearedKeys.length === 0) {
    console.log(`   ℹ️  No cache keys found to clear (KV might not be configured or already empty)`)
  }
}

clearContributorsCache()
