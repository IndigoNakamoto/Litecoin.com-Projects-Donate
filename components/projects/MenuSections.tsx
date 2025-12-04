'use client'

import React from 'react'
import ProjectContent from './ProjectContent'
import ProjectUpdate from './ProjectUpdate'
import { TwitterUser } from '@/utils/types'
import type { Contributor } from '@/types/project'

type MenuSectionsProps = {
  selectedMenuItem: string
  title: string
  content: string
  socialSummary: string
  faq: any
  faqCount: number
  updates: any[]
  selectedUpdateId: number | null
  setSelectedUpdateId: (id: number | null) => void
  hashtag: string
  tweetsData: any
  twitterContributors: TwitterUser[]
  twitterContributorsBitcoin: Contributor[] | TwitterUser[]
  twitterContributorsLitecoin: Contributor[] | TwitterUser[]
  twitterAdvocates: Contributor[] | TwitterUser[]
  twitterUsers: TwitterUser[]
  isBitcoinOlympics2024: boolean
  formatLits: (value: any) => string
  formatUSD: (value: any) => string
  website: string
  gitRepository: string
  twitterHandle: string
  discordLink: string
  telegramLink: string
  facebookLink: string
  redditLink: string
}

const MenuSections: React.FC<MenuSectionsProps> = ({
  selectedMenuItem,
  title,
  content,
  socialSummary,
  faq,
  faqCount,
  updates,
  selectedUpdateId,
  setSelectedUpdateId,
  website,
  gitRepository,
  twitterHandle,
  discordLink,
  telegramLink,
  facebookLink,
  redditLink,
}) => {
  switch (selectedMenuItem) {
    case 'Info':
      return (
        <div>
          <div className="markdown">
            <ProjectContent
              title={title}
              content={content}
              socialSummary={socialSummary}
              website={website}
              gitRepository={gitRepository}
              twitterHandle={twitterHandle}
              discordLink={discordLink}
              telegramLink={telegramLink}
              facebookLink={facebookLink}
              redditLink={redditLink}
              bitcoinContributors={twitterContributorsBitcoin as Contributor[]}
              litecoinContributors={twitterContributorsLitecoin as Contributor[]}
              advocates={twitterAdvocates as Contributor[]}
            />
          </div>
        </div>
      )
    case 'posts':
      return (
        <div className="markdown">
          <p>Posts feature coming soon...</p>
        </div>
      )
    case 'faq':
      return (
        <div className="markdown">
          {faqCount > 0 ? (
            <div>
              <h2>Frequently Asked Questions</h2>
              {Array.isArray(faq) && faq.map((item: any, index: number) => (
                <div key={index} className="mb-4">
                  <h3 className="font-semibold">{item.question || item.fieldData?.name}</h3>
                  <p>{item.answer || item.fieldData?.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No FAQs available for this project.</p>
          )}
        </div>
      )
    case 'updates':
      return (
        <div className="markdown min-h-full">
          <div>
            {updates && updates.length > 0 ? (
              updates.map((post: any, index: number) => (
                <div key={index} id={`update-${post.id || index}`}>
                  <ProjectUpdate
                    title={post.title || post.fieldData?.name || 'Update'}
                    summary={post.summary || post.fieldData?.summary || ''}
                    authorTwitterHandle={post.authorTwitterHandle || ''}
                    date={post.date || post.fieldData?.createdOn || ''}
                    tags={post.tags || []}
                    content={post.content || post.fieldData?.content}
                    id={post.id || index}
                    highlight={selectedUpdateId === (post.id || index)}
                  />
                </div>
              ))
            ) : (
              <h1>No updates available for this project.</h1>
            )}
          </div>
        </div>
      )
    default:
      return null
  }
}

export default MenuSections

