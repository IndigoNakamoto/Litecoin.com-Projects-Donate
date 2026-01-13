import { usePayloadCMS } from './config'

import * as webflow from '@/services/webflow/faqs'
import * as payload from '@/services/payload/faqs'

export type { FAQItem } from '@/services/webflow/faqs'

export async function getFAQsByProjectSlug(...args: Parameters<typeof webflow.getFAQsByProjectSlug>) {
  return usePayloadCMS()
    ? payload.getFAQsByProjectSlug(...args)
    : webflow.getFAQsByProjectSlug(...args)
}


