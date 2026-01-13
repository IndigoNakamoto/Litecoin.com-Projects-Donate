import { usePayloadCMS } from './config'

import * as webflow from '@/services/webflow/updates'
import * as payload from '@/services/payload/updates'

export type { Update } from '@/services/webflow/updates'

export async function getUpdatesByProjectSlug(...args: Parameters<typeof webflow.getUpdatesByProjectSlug>) {
  return usePayloadCMS()
    ? payload.getUpdatesByProjectSlug(...args)
    : webflow.getUpdatesByProjectSlug(...args)
}


