import { usePayloadCMS } from './config'

import * as webflow from '@/services/webflow/posts'
import * as payload from '@/services/payload/posts'

export type { Post } from '@/services/webflow/posts'

export async function getPostsByProjectSlug(...args: Parameters<typeof webflow.getPostsByProjectSlug>) {
  return usePayloadCMS()
    ? payload.getPostsByProjectSlug(...args)
    : webflow.getPostsByProjectSlug(...args)
}


