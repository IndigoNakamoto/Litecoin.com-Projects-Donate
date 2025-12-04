'use client'

import React, { useState } from 'react'
import ProjectSocialLinks from './ProjectSocialLinks'

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
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div>
      <h2>Info</h2>
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
              <div className="flex gap-4">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-gray-600 transition-colors duration-300 hover:text-gray-900"
                >
                  <span className="sr-only">x</span>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                    </svg>
                  </div>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-gray-600 transition-colors duration-300 hover:text-gray-900"
                >
                  <span className="sr-only">facebook</span>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {content && (
        <div className="markdown" dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  )
}

export default ProjectContent

