// prisma/config.ts
// Prisma 7 configuration file for migrations and db push commands
// Note: This file is used by Prisma CLI, not by the Next.js build

/**
 * Get the database URL from environment variables
 */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || ''
}

// Export config without strict typing - Prisma CLI will use this
// The type system doesn't recognize all Prisma 7 config options yet
const config = {
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: async () => {
      const { Pool } = await import('pg')
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new Pool({ connectionString: getDatabaseUrl() })
      return new PrismaPg(pool)
    },
  },
} as const

export default config
