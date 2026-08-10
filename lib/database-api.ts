/**
 * Headers for calling database-api-server.
 * DATABASE_API_KEY is required once enforcement is enabled on the API.
 */
export function databaseApiHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  const apiKey = process.env.DATABASE_API_KEY
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }
  return headers
}

export function getDatabaseApiUrl(): string {
  return process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
}
