import { kv } from '../lib/kv'

async function clearProjectCache(slug?: string) {
  console.log('🗑️  Clearing project cache...\n')

  let clearedCount = 0

  try {
    if (slug) {
      // Clear specific project cache
      const cacheKey = `payload:project:${slug}`
      const deleted = await kv.del(cacheKey)
      if (deleted > 0) {
        clearedCount += deleted
        console.log(`  ✓ Cleared cache for project: ${slug}`)
      } else {
        console.log(`  ℹ️  No cache found for project: ${slug}`)
      }
    } else {
      // Clear all project caches
      const keys = await kv.keys('payload:project:*')
      for (const key of keys) {
        await kv.del(key)
        clearedCount++
        console.log(`  ✓ Cleared: ${key}`)
      }
      
      if (keys.length === 0) {
        console.log(`  ℹ️  No project cache keys found`)
      }
    }
  } catch (error) {
    console.warn(`  ⚠️  Error clearing cache:`, error instanceof Error ? error.message : error)
  }

  console.log(`\n✅ Project cache clear complete!`)
  console.log(`   Total keys cleared: ${clearedCount}`)
}

const slug = process.argv[2]
clearProjectCache(slug).catch(console.error)
