import { usePayloadCMS } from './config'

import * as webflow from '@/services/webflow/projects'
import * as payload from '@/services/payload/projects'

export async function getAllPublishedProjects(...args: Parameters<typeof webflow.getAllPublishedProjects>) {
  const usePayload = usePayloadCMS()
  console.log('[cms/projects] getAllPublishedProjects - USE_PAYLOAD_CMS:', usePayload)
  return usePayload
    ? payload.getAllPublishedProjects(...args)
    : webflow.getAllPublishedProjects(...args)
}

export async function getProjectBySlug(...args: Parameters<typeof webflow.getProjectBySlug>) {
  return usePayloadCMS()
    ? payload.getProjectBySlug(...args)
    : webflow.getProjectBySlug(...args)
}

export async function getProjectSummaries(...args: Parameters<typeof webflow.getProjectSummaries>) {
  return usePayloadCMS()
    ? payload.getProjectSummaries(...args)
    : webflow.getProjectSummaries(...args)
}






