'use client'

import React from 'react'
import Link from 'next/link'

type ProjectSocialLinksProps = {
  website?: string
  gitRepository?: string
  twitterHandle?: string
  discordLink?: string
  telegramLink?: string
  facebookLink?: string
  redditLink?: string
  onHowDonationsWorkClick?: () => void
}

const formatLinkText = (kind: string, url: string) => {
  if (!url) return ''

  const normalizedUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '')

  switch (kind) {
    case 'website':
      return normalizedUrl
    case 'github':
      return 'Github'
    case 'x':
    case 'twitter':
    case 'telegram':
      return `@${normalizedUrl.split('/').pop()}`
    case 'discord':
      return 'Discord'
    case 'facebook':
      return normalizedUrl.split('/').pop()
    case 'reddit':
      return `/r/${normalizedUrl.split('/').pop()}`
    default:
      return normalizedUrl
  }
}

const ProjectSocialLinks: React.FC<ProjectSocialLinksProps> = ({
  website,
  gitRepository,
  twitterHandle,
  discordLink,
  telegramLink,
  facebookLink,
  redditLink,
  onHowDonationsWorkClick,
}) => {
  const projectLinks = [
    { kind: 'website', url: website },
    { kind: 'github', url: gitRepository },
    { kind: 'twitter', url: twitterHandle },
    { kind: 'discord', url: discordLink },
    { kind: 'telegram', url: telegramLink },
    { kind: 'facebook', url: facebookLink },
    { kind: 'reddit', url: redditLink },
  ]

  return (
    <div className="flex flex-col px-6">
      <h3>Links:</h3>
      {projectLinks.map((link) =>
        link.url ? (
          <a
            key={link.kind}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center space-x-2 text-[#222222] no-underline transition-colors duration-300 hover:font-semibold hover:text-gray-900"
          >
            <span className="text-md leading-none text-[#222222] group-hover:text-gray-900">
              {formatLinkText(link.kind, link.url)}
            </span>
          </a>
        ) : null
      )}
      {onHowDonationsWorkClick && (
        <div
          onClick={onHowDonationsWorkClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onHowDonationsWorkClick()
            }
          }}
          role="button"
          tabIndex={0}
          className="group flex cursor-pointer items-center space-x-2 text-[#222222] no-underline transition-colors duration-300 hover:font-semibold hover:text-gray-900"
        >
          <span className="text-md leading-none text-[#222222] group-hover:text-gray-900 group-hover:underline">
            How Donations Work
          </span>
        </div>
      )}
    </div>
  )
}

export default ProjectSocialLinks

