import { usePayloadCMS } from './config'

import * as webflow from '@/services/webflow/contributors'
import * as payload from '@/services/payload/contributors'

export async function getAllActiveContributors(...args: Parameters<typeof webflow.getAllActiveContributors>) {
  return usePayloadCMS()
    ? payload.getAllActiveContributors(...args)
    : webflow.getAllActiveContributors(...args)
}






