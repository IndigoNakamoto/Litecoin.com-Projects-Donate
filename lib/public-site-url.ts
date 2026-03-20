import type { NextRequest } from 'next/server'

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/**
 * Canonical browser-facing origin for links (Discord, emails).
 * Prefer env so links are correct behind reverse proxies / tunnels.
 */
export function getPublicSiteOrigin(request: NextRequest): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_PUBLIC_URL?.trim()
  if (fromEnv) {
    return stripTrailingSlash(fromEnv)
  }

  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim()
  if (host) {
    return `${proto}://${host}`
  }

  return new URL(request.url).origin
}

export function submissionDetailPath(id: string): string {
  return `/projects/submitted/${id}`
}
