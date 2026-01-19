/**
 * Script to clear all KV caches
 * 
 * Usage:
 *   cd litecoin-fund
 *   npx tsx scripts/clear-cache.ts
 */

import { kv } from '../lib/kv'

const CACHE_PATTERNS = [
  'webflow:*',
  'payload:*',
  'posts:*',
  'faqs:*',
  'updates:*',
  'contributors:*',
  'projects:*',
]

async function clearAllCaches() {
  console.log('🗑️  Clearing all caches...\n')

  const clearedKeys: string[] = []

  try {
    // Clear by patterns
    for (const pattern of CACHE_PATTERNS) {
      try {
        const keys = await kv.keys(pattern)
        for (const key of keys) {
          await kv.del(key)
          clearedKeys.push(key)
        }
        if (keys.length > 0) {
          console.log(`  ✓ Cleared ${keys.length} key(s) matching pattern: ${pattern}`)
        }
      } catch (error) {
        console.warn(`  ⚠️  Error clearing pattern ${pattern}:`, error instanceof Error ? error.message : error)
      }
    }

    // Clear specific known keys that might not match patterns
    const knownKeys = [
      'webflow:projects:status-map',
      'webflow:projects:published',
      'payload:projects:published',
      'webflow:contributors:active',
      'payload:contributors:active',
    ]

    for (const key of knownKeys) {
      try {
        const deleted = await kv.del(key)
        if (deleted > 0) {
          clearedKeys.push(key)
          console.log(`  ✓ Cleared: ${key}`)
        }
      } catch (error) {
        // Key might not exist, continue
      }
    }

    console.log(`\n✅ Cache clear complete!`)
    console.log(`   Total keys cleared: ${clearedKeys.length}`)
    
    if (clearedKeys.length === 0) {
      console.log(`   ℹ️  No cache keys found to clear (KV might not be configured or already empty)`)
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
    process.exit(1)
  }
}

clearAllCaches()
