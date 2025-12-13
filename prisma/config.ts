// prisma/config.ts
// Note: Prisma configuration is done in schema.prisma, not here
// This file is kept for potential utility exports if needed

/**
 * Get the database URL from environment variables
 * Prisma reads this from DATABASE_URL automatically in schema.prisma
 */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || ''
}

const config = {
  datasource: {
    url: getDatabaseUrl(),
  },
}

export default config

