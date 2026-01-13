import axios, { AxiosInstance } from 'axios'

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '')
}

function resolvePayloadApiUrl(): string {
  // Explicit API URL always wins
  if (process.env.PAYLOAD_API_URL) return process.env.PAYLOAD_API_URL

  // Allow setting a base server URL and deriving the REST prefix
  if (process.env.PAYLOAD_CMS_URL) {
    const base = stripTrailingSlashes(process.env.PAYLOAD_CMS_URL)
    return `${base}/api`
  }

  // Migration convenience: if toggled on and no URL is set, assume the local
  // Payload instance is running on 3001 (your current dev setup).
  if (process.env.USE_PAYLOAD_CMS?.trim().toLowerCase() === 'true') {
    return 'http://localhost:3001/api'
  }

  // Default from the integration guide
  return 'http://localhost:3000/api'
}

const PAYLOAD_API_URL = resolvePayloadApiUrl()

export function resolvePayloadServerUrl(): string {
  if (process.env.PAYLOAD_CMS_URL) return stripTrailingSlashes(process.env.PAYLOAD_CMS_URL)
  // Derive from API URL (strip /api suffix if present)
  if (PAYLOAD_API_URL.endsWith('/api')) return PAYLOAD_API_URL.slice(0, -'/api'.length)
  return PAYLOAD_API_URL
}

export function resolvePayloadAssetUrl(url?: string): string | undefined {
  if (!url) return undefined
  // Already absolute
  if (/^https?:\/\//i.test(url)) return url
  // Payload typically returns media URLs like "/media/xyz.jpg"
  if (url.startsWith('/')) return `${resolvePayloadServerUrl()}${url}`
  return url
}

/**
 * Create a Payload CMS API client
 */
export function createPayloadClient(): AxiosInstance {
  const apiToken = process.env.PAYLOAD_API_TOKEN

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add authentication if API token is provided
  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`
  }

  return axios.create({
    baseURL: PAYLOAD_API_URL,
    headers,
  })
}

/**
 * Helper to fetch paginated results from Payload
 */
export async function fetchAllPages<T>(
  client: AxiosInstance,
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const allItems: T[] = []
  let page = 1
  const limit = 100 // Payload default limit

  while (true) {
    const response = await client.get(endpoint, {
      params: {
        ...params,
        page,
        limit,
      },
    })

    const { docs, totalPages } = response.data

    allItems.push(...docs)

    if (page >= totalPages) {
      break
    }

    page++
  }

  return allItems
}



