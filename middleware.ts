import { NextRequest, NextResponse } from 'next/server'

/**
 * Content-Security-Policy for the donate/projects app.
 *
 * Why 'unsafe-inline' (and no nonce/`strict-dynamic`):
 * litecoin.com sits behind Cloudflare Rocket Loader, which rewrites <script>
 * tags and strips nonces. With a nonce present, browsers ignore 'unsafe-inline',
 * so Rocket Loader's rewritten Next.js hydration scripts are blocked and the
 * page never hydrates (empty stats/contributors, broken interactivity).
 *
 * XSS defense-in-depth for CMS content remains:
 * - authenticated CMS writes
 * - lexicalToHtml attribute escaping / href allowlist
 * - DOMPurify at dangerouslySetInnerHTML sinks
 * - no 'unsafe-eval'
 *
 * To re-enable nonce CSP later: disable Rocket Loader for /projects* (and /donate*)
 * in Cloudflare, then restore nonce + drop 'unsafe-inline'.
 */
export function middleware(_request: NextRequest) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://dev.shift4.com https://js.dev.shift4.com https://widget.thegivingblock.com https://vercel.live https://va.vercel-scripts.com https://static.cloudflareinsights.com https://giscus.app https://litecoin.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https://pbs.twimg.com https://unavatar.io https://abs.twimg.com https://static.tgb-preprod.com https://static.tgbwidget.com https://cdn.prod.website-files.com https://litecoin.com https://litecoin.net https://uploads-ssl.webflow.com https://static.webflow.com https://images.webflow.com https://dev.shift4.com https://t.dev.shift4.com https://projectscms.lite.space http://localhost:3011 http://127.0.0.1:3011 blob: data:",
    "media-src 'self' https://video.twimg.com",
    "connect-src 'self' https://react-tweet.vercel.app https://vitals.vercel-insights.com https://public-api.tgbwidget.com https://dev.shift4.com https://t.dev.shift4.com https://js.dev.shift4.com https://cloudflareinsights.com https://litecoin.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src https://giscus.app https://dev.shift4.com https://js.dev.shift4.com https://widget.thegivingblock.com https://www.youtube.com https://www.youtube-nocookie.com https://www.redditmedia.com/",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|static/).*)',
  ],
}
