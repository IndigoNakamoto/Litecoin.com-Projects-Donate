import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize CMS-sourced HTML before dangerouslySetInnerHTML.
 * Strips scripts, event handlers, and dangerous URI schemes.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover'],
  })
}
