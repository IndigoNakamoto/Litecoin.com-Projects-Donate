// Create a safe wrapper that handles missing KV credentials
const mockKv = {
  get: async <T>(_key: string): Promise<T | null> => null,
  set: async (_key: string, _value: any, _options?: { ex?: number }): Promise<string> => 'OK',
  del: async (_key: string): Promise<number> => 0,
  exists: async (_key: string): Promise<number> => 0,
  keys: async (_pattern?: string): Promise<string[]> => [],
}

let kv: typeof mockKv

try {
  // Local Docker / self-hosted: .env often contains production KV keys; that serves stale
  // cached stats from Vercel instead of your container Postgres. Set DISABLE_VERCEL_KV=1
  // in compose (or omit KV_* vars) to use the in-memory no-op client.
  const vercelKvDisabled =
    process.env.DISABLE_VERCEL_KV === '1' ||
    process.env.DISABLE_VERCEL_KV === 'true'

  if (
    !vercelKvDisabled &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  ) {
    // Dynamically import only if credentials are present
    const vercelKvModule = require('@vercel/kv')
    kv = vercelKvModule.kv
  } else {
    kv = mockKv
  }
} catch (error) {
  // If KV initialization fails, use mock
  kv = mockKv
}

export { kv }

