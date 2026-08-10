/**
 * Convert Lexical editor JSON to HTML
 * This is a basic serializer for Lexical content
 */

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number
  style?: string
  [key: string]: unknown
}

interface LexicalRoot {
  root: {
    children: LexicalNode[]
    [key: string]: unknown
  }
}

const ALLOWED_HREF_SCHEMES = /^(https?:|mailto:)/i
const ALLOWED_HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const ALLOWED_LINK_TARGETS = new Set(['_blank', '_self'])

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Check if content is Lexical JSON format
 */
function isLexicalJSON(content: unknown): content is LexicalRoot {
  if (typeof content !== 'object' || content === null) return false
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      return parsed?.root?.children !== undefined
    } catch {
      return false
    }
  }
  return (content as LexicalRoot)?.root?.children !== undefined
}

/**
 * Serialize a single Lexical node to HTML
 */
function serializeNode(node: LexicalNode): string {
  const { type, children, text, format } = node

  // Text node — never emit raw style attributes (injection vector)
  if (type === 'text' && text !== undefined) {
    let html = escapeText(text)

    // Apply formatting
    if (format) {
      if (format & 1) html = `<strong>${html}</strong>` // bold
      if (format & 2) html = `<em>${html}</em>` // italic
      if (format & 4) html = `<s>${html}</s>` // strikethrough
      if (format & 8) html = `<u>${html}</u>` // underline
      if (format & 16) html = `<code>${html}</code>` // code
    }

    return html
  }

  // Element nodes — only known safe tags
  let tag: string | null = null
  let attributes = ''

  switch (type) {
    case 'paragraph':
      tag = 'p'
      break
    case 'heading': {
      const level = (node.tag as string) || 'h1'
      tag = ALLOWED_HEADINGS.has(level) ? level : 'h2'
      break
    }
    case 'list':
      tag = node.listType === 'number' ? 'ol' : 'ul'
      break
    case 'listitem':
      tag = 'li'
      break
    case 'quote':
      tag = 'blockquote'
      break
    case 'code':
      tag = 'pre'
      break
    case 'link': {
      tag = 'a'
      const url = typeof node.url === 'string' ? node.url.trim() : ''
      if (url && ALLOWED_HREF_SCHEMES.test(url)) {
        attributes = ` href="${escapeAttr(url)}"`
        const target = typeof node.target === 'string' ? node.target : ''
        if (target && ALLOWED_LINK_TARGETS.has(target)) {
          attributes += ` target="${escapeAttr(target)}"`
          if (target === '_blank') {
            attributes += ' rel="noopener noreferrer"'
          }
        }
      }
      break
    }
    case 'linebreak':
      return '<br />'
    default:
      // Unknown types: serialize children only (never promote type to a tag)
      tag = null
  }

  const childrenHtml = children ? children.map(serializeNode).join('') : ''

  if (!tag) {
    return childrenHtml
  }

  return `<${tag}${attributes}>${childrenHtml}</${tag}>`
}

/**
 * Convert Lexical JSON to HTML
 */
export function lexicalToHtml(content: unknown): string {
  // If it's already a string and looks like HTML, return it
  if (typeof content === 'string') {
    // Check if it's JSON string
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(content)
        if (isLexicalJSON(parsed)) {
          return serializeLexical(parsed)
        }
      } catch {
        // Not JSON, might be HTML — caller should sanitize before rendering
        return content
      }
    }
    // Already HTML or plain text
    return content
  }

  // If it's an object, check if it's Lexical format
  if (isLexicalJSON(content)) {
    return serializeLexical(content)
  }

  // If it's an object but not Lexical, stringify it (fallback)
  if (typeof content === 'object' && content !== null) {
    return ''
  }

  return String(content || '')
}

/**
 * Serialize Lexical root to HTML
 */
function serializeLexical(lexical: LexicalRoot): string {
  const { root } = lexical
  if (!root?.children || !Array.isArray(root.children)) {
    return ''
  }

  const html = root.children.map(serializeNode).join('').trim()

  // If the result is just empty paragraphs or whitespace, return empty string
  if (!html || html === '<p></p>' || html.match(/^<p>\s*<\/p>$/)) {
    return ''
  }

  return html
}
