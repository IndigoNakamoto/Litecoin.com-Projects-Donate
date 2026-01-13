export type PayloadID = string | number

export function toAppID(id: PayloadID): string {
  return String(id)
}

/**
 * Payload Postgres default IDs are numeric. When querying, we should pass numbers
 * where possible, but remain compatible with UUID/string IDs if the CMS config changes.
 */
export function toPayloadID(id: PayloadID): PayloadID {
  if (typeof id === 'number') return id
  const trimmed = id.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  return id
}






