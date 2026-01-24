import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDbInfo(databaseUrl: string | undefined): {
  ok: boolean
  host?: string
  database?: string
  warning?: string
} {
  if (!databaseUrl) return { ok: false, warning: 'DATABASE_URL is not set' }

  try {
    const u = new URL(databaseUrl)
    const database = decodeURIComponent((u.pathname || '').replace(/^\//, ''))
    const host = u.host

    if (!database) return { ok: true, host, database, warning: 'Missing database name in DATABASE_URL' }

    if (database.startsWith('prisma_migrate_shadow_db_') || database.includes('shadow_db')) {
      return { ok: true, host, database, warning: 'DATABASE_URL points at a Prisma migrate shadow database' }
    }

    if (database.includes('/')) {
      return {
        ok: true,
        host,
        database,
        warning:
          'DATABASE_URL database name contains "/". This usually means your URL is malformed (often due to unescaped special characters in the password).',
      }
    }

    return { ok: true, host, database }
  } catch {
    return { ok: false, warning: 'DATABASE_URL is not a valid URL' }
  }
}

if (process.env.NODE_ENV !== 'production') {
  const info = getDbInfo(process.env.DATABASE_URL)
  if (info.warning) {
    console.warn('[prisma] DATABASE_URL warning:', info.warning, {
      host: info.host,
      database: info.database,
    })
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Increase timeout for Cloudflare tunnel connections
  connectionTimeoutMillis: 30000, // 30 seconds
  // Keep connections alive longer
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
})

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Prisma 7 reads DATABASE_URL from environment automatically
    // Connection URL is configured in prisma/config.ts for migrations
    // Suppress error logs - we handle P2021 (table doesn't exist) gracefully with fallback
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'warn'] // Removed 'error' to suppress P2021 noise
      : ['warn'], // Only log warnings in production
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

