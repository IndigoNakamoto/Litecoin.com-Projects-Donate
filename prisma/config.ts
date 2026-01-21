// prisma/config.ts
// Prisma 7 configuration file for migrations and db push commands

import type { PrismaConfig } from 'prisma'

/**
 * Get the database URL from environment variables
 */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || ''
}

const config: PrismaConfig = {
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: async () => {
      const { Pool } = await import('pg')
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new Pool({ connectionString: getDatabaseUrl() })
      return new PrismaPg(pool)
    },
  },
}

export default config
