/**
 * Canonical The Giving Block organization ID for this fund.
 * Never trust a client-supplied organizationId for pledge creation.
 */
export const TGB_ORGANIZATION_ID = Number(
  process.env.TGB_ORGANIZATION_ID || '1189134331'
)

if (!Number.isFinite(TGB_ORGANIZATION_ID) || TGB_ORGANIZATION_ID <= 0) {
  throw new Error('TGB_ORGANIZATION_ID must be a positive number')
}
