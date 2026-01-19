import { kv } from '../lib/kv'

async function clearProjectsCache() {
  console.log('🗑️  Clearing projects list cache...\n')

  let clearedCount = 0

  try {
    const cacheKey = 'payload:projects:published'
    const deleted = await kv.del(cacheKey)
    if (deleted > 0) {
      clearedCount += deleted
      console.log(`  ✓ Cleared cache key: ${cacheKey}`)
    } else {
      console.log(`  ℹ️  No cache found for: ${cacheKey}`)
    }
  } catch (error) {
    console.warn(`  ⚠️  Error clearing cache:`, error instanceof Error ? error.message : error)
  }

  console.log(`\n✅ Projects cache clear complete!`)
  console.log(`   Total keys cleared: ${clearedCount}`)
  
  if (clearedCount === 0) {
    console.log(`   ℹ️  No cache keys found to clear (KV might not be configured or already empty)`)
  }
}

clearProjectsCache().catch(console.error)
