'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import ProjectSocialLinks from './ProjectSocialLinks'
import ProjectContributors from './ProjectContributors'
import Notification from '@/components/ui/Notification'
import type { Contributor } from '@/types/project'

type ProjectContentProps = {
  title: string
  content: string
  socialSummary: string
  website?: string
  gitRepository?: string
  twitterHandle?: string
  discordLink?: string
  telegramLink?: string
  facebookLink?: string
  redditLink?: string
  bitcoinContributors?: Contributor[]
  litecoinContributors?: Contributor[]
  advocates?: Contributor[]
}

const ProjectContent: React.FC<ProjectContentProps> = ({
  title,
  content,
  socialSummary,
  website,
  gitRepository,
  twitterHandle,
  discordLink,
  telegramLink,
  facebookLink,
  redditLink,
  bitcoinContributors,
  litecoinContributors,
  advocates,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notification, setNotification] = useState('')
  const pathname = usePathname()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  // Function to copy text to clipboard and show notification
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setNotification('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
      setNotification('Failed to copy the link. Please try again.')
    }
  }

  const currentURL = typeof window !== 'undefined' 
    ? `${window.location.origin}${pathname}`
    : ''

  return (
    <div>
      <h2 className="font-space-grotesk">Info</h2>
      <div className="flex w-full flex-col items-start rounded-md bg-[#c6d3d6] lg:flex-row">
        <div className="flex w-full flex-col rounded-md bg-[#c6d3d6] lg:flex-row">
          <div className="w-full p-4 lg:w-1/2">
            <ProjectSocialLinks
              website={website}
              gitRepository={gitRepository}
              twitterHandle={twitterHandle}
              discordLink={discordLink}
              telegramLink={telegramLink}
              facebookLink={facebookLink}
              redditLink={redditLink}
              onHowDonationsWorkClick={openModal}
            />
          </div>

          <div className="w-full p-4 lg:w-1/2">
            <div className="markdown pb-6 pl-6">
              <h3>Share:</h3>
              <div className="flex gap-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    copyToClipboard(currentURL)
                  }}
                  className="inline-block text-gray-700 transition-colors duration-300 hover:text-gray-900"
                >
                  <span className="sr-only">Copy link</span>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg">
                    <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                  </div>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentURL)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-gray-700 transition-colors duration-300 hover:text-gray-900"
                >
                  <span className="sr-only">x</span>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg">
                    <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                    </svg>
                  </div>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentURL)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-gray-700 transition-colors duration-300 hover:text-gray-900"
                >
                  <span className="sr-only">facebook</span>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg">
                    <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {content && content.trim() && (
        <div className="markdown" dangerouslySetInnerHTML={{ __html: content }} />
      )}
      <ProjectContributors
        bitcoinContributors={bitcoinContributors}
        litecoinContributors={litecoinContributors}
        advocates={advocates}
      />
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification('')}
        />
      )}
    </div>
  )
}

export default ProjectContent

