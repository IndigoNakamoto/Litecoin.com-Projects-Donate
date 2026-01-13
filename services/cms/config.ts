export function usePayloadCMS(): boolean {
  const raw = process.env.USE_PAYLOAD_CMS
  if (!raw) return false

  const normalized = raw.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
}






