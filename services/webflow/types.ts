export interface WebflowProject {
  id: string
  cmsLocaleId: string
  lastPublished: string
  lastUpdated: string
  createdOn: string
  isArchived: boolean
  isDraft: boolean
  fieldData: {
    'github-link'?: string
    'telegram-link'?: string
    'facebook-link'?: string
    'discord-link'?: string
    'reddit-link'?: string
    'website-link'?: string
    'twitter-link'?: string
    hidden: boolean
    recurring: boolean
    'service-fees-collected': number
    'total-paid': number
    'litecoin-raised'?: number
    'litecoin-paid'?: number
    summary: string
    name: string
    slug: string
    content?: string
    'bitcoin-contributors'?: string[]
    'litecoin-contributors'?: string[]
    advocates?: string[]
    hashtags?: string[]
    status: string
    'project-type'?: string
    'cover-image'?: {
      fileId: string
      url: string
      alt: string | null
    }
  }
}

