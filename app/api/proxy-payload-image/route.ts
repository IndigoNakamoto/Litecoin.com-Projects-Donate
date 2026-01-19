import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route to serve Payload CMS images through Next.js
 * This avoids Next.js Image component blocking localhost images
 * 
 * Usage: /api/proxy-payload-image?url=http://localhost:3001/api/media/file/xyz.jpg
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  let imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  /**
   * IMPORTANT:
   * - `request.nextUrl.searchParams.get('url')` is already URL-decoded once.
   * - If the client uses `encodeURIComponent(src)`, the server will receive the original `src`
   *   (including any `%2520` sequences Payload emits for spaces).
   * - Calling `decodeURIComponent()` again would incorrectly turn `%2520` into `%20`,
   *   causing Payload to look for the wrong filename.
   */

  // Only allow Payload CMS URLs for security
  const payloadUrl = process.env.PAYLOAD_CMS_URL || 'http://localhost:3001'
  // Allow relative URLs coming directly from Payload (e.g. "/api/media/file/...")
  if (imageUrl.startsWith('/')) {
    imageUrl = `${payloadUrl.replace(/\/+$/, '')}${imageUrl}`
  }

  // Validate/normalize URL
  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    return new NextResponse('Invalid image URL', { status: 400 })
  }

  let payloadOrigin: string | null = null
  try {
    payloadOrigin = new URL(payloadUrl).origin
  } catch {
    // If PAYLOAD_CMS_URL is misconfigured, fall back to a safe default
    payloadOrigin = 'http://localhost:3001'
  }

  const allowedOrigins = new Set<string>([
    payloadOrigin,
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ])

  if (!allowedOrigins.has(parsed.origin)) {
    return new NextResponse('Invalid image URL', { status: 400 })
  }

  // Do not decode/re-encode further: we want to fetch exactly what the caller provided.
  // Next already URL-decodes search params once, so additional decoding here would break
  // percent-encoded filenames.
  imageUrl = parsed.toString()

  try {
    // imageUrl is already processed above, use it directly
    const response = await fetch(imageUrl, {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    
    if (!response.ok) {
      // Try to get error details from Payload
      let errorText = ''
      try {
        errorText = await response.text()
      } catch {
        errorText = 'No error details available'
      }
      console.error(`Failed to fetch image: ${imageUrl}`)
      console.error(`  Status: ${response.status}`)
      console.error(`  Error: ${errorText.substring(0, 200)}`)
      return new NextResponse(`Image not found: ${response.status}`, { status: response.status })
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error('Error proxying image:', imageUrl, error.message)
    // Return a more specific error message
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return new NextResponse('Request timeout', { status: 504 })
    }
    return new NextResponse(`Error fetching image: ${error.message}`, { status: 500 })
  }
}
