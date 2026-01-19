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
  const { type, children, text, format, style } = node

  // Text node
  if (type === 'text' && text !== undefined) {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    // Apply formatting
    if (format) {
      if (format & 1) html = `<strong>${html}</strong>` // bold
      if (format & 2) html = `<em>${html}</em>` // italic
      if (format & 4) html = `<s>${html}</s>` // strikethrough
      if (format & 8) html = `<u>${html}</u>` // underline
      if (format & 16) html = `<code>${html}</code>` // code
    }

    if (style) {
      html = `<span style="${style}">${html}</span>`
    }

    return html
  }

  // Element nodes
  let tag = 'div'
  let attributes = ''

  switch (type) {
    case 'paragraph':
      tag = 'p'
      break
    case 'heading':
      const level = (node.tag as string) || 'h1'
      tag = level
      break
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
    case 'link':
      tag = 'a'
      const url = node.url as string
      if (url) {
        attributes = ` href="${url.replace(/"/g, '&quot;')}"`
        if (node.target) {
          attributes += ` target="${node.target}"`
        }
      }
      break
    case 'linebreak':
      return '<br />'
    default:
      // For unknown types, try to use the type as tag if it's a valid HTML tag
      if (type && /^[a-z][a-z0-9]*$/.test(type)) {
        tag = type
      }
  }

  // Serialize children
  const childrenHtml = children
    ? children.map(serializeNode).join('')
    : ''

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
        // Not JSON, might be HTML
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
