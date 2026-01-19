'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import ReactModal from 'react-modal'
import SocialIcon from './SocialIcon'
import { customImageLoader } from '@/utils/customImageLoader'
import type { Contributor } from '@/types/project'

export interface ContributorCardProps {
  contributor: Contributor
  backgroundColor?: string
}

const ContributorCard: React.FC<ContributorCardProps> = ({ contributor, backgroundColor = '!bg-[white]' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ReactModal.setAppElement('body')
    }
  }, [])

  const handleCardClick = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const getInitials = (name: string) => {
    const names = name.split(' ')
    const initials = names.map((n) => n.charAt(0).toUpperCase())
    return initials.slice(0, 2).join('')
  }

  const formatLinkText = (kind: string, url: string): string => {
    if (!url) {
      return ''
    }

    const normalizedUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '')

    switch (kind) {
      case 'website':
        return normalizedUrl
      case 'github':
        return 'GitHub'
      case 'twitter':
        return `@${normalizedUrl.split('/').pop()}`
      case 'discord':
        return 'Discord'
      case 'telegram':
        return `@${normalizedUrl.split('/').pop()}`
      case 'facebook':
        return normalizedUrl.split('/').pop() || ''
      case 'reddit': {
        const redditUsername = normalizedUrl.split('/').filter(Boolean).pop()
        return redditUsername ? `u/${redditUsername}` : ''
      }
      case 'linkedin':
        return 'LinkedIn'
      case 'youtube':
        return 'YouTube'
      case 'email':
        return normalizedUrl
      default:
        return normalizedUrl
    }
  }

  const socialLinks = [
    { kind: 'github', url: contributor.githubLink },
    { kind: 'twitter', url: contributor.twitterLink },
    { kind: 'discord', url: contributor.discordLink },
    { kind: 'youtube', url: contributor.youtubeLink },
    { kind: 'linkedin', url: contributor.linkedinLink },
    { kind: 'email', url: contributor.email },
  ].filter((link) => link.url)

  return (
    <>
      <button
        className={`contributor group w-full transform cursor-pointer border-none ${backgroundColor} !p-3 text-center transition-transform duration-300 focus:outline-none group-hover:scale-105`}
        onClick={handleCardClick}
        tabIndex={0}
      >
        {/* Use aspect-square to maintain square aspect ratio */}
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105">
          {contributor.avatar ? (
            <Image
              loader={customImageLoader}
              src={contributor.avatar}
              alt={contributor.name}
              className="h-full w-full rounded-full object-cover p-1"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{
                objectFit: 'cover',
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-300">
              <span className="text-2xl font-semibold text-gray-600">
                {getInitials(contributor.name)}
              </span>
            </div>
          )}
          {/* Overlay on hover */}
          <div 
            className="absolute inset-0 z-10 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          >
            <span 
              className="text-center text-xs sm:text-sm font-bold text-white px-2 break-words leading-tight drop-shadow-lg"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
            >
              {contributor.name || 'Contributor'}
            </span>
          </div>
        </div>
      </button>

      {/* Modal */}
      <ReactModal
        isOpen={isModalOpen}
        onRequestClose={handleModalClose}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        className="h-auto max-w-md overflow-y-auto rounded bg-white p-8 shadow-xl outline-none sm:m-8 sm:w-full"
        overlayClassName="fixed inset-0 z-40 flex items-center justify-center"
        style={{
          overlay: {
            backgroundColor: 'rgba(34, 34, 34, 0.8)',
          },
        }}
        ariaHideApp={false}
      >
        {/* Close button */}
        <div className="relative mb-4 flex justify-end">
          <button
            onClick={handleModalClose}
            className="text-2xl font-bold text-gray-600 hover:text-gray-800 focus:outline-none"
            aria-label="Close Modal"
          >
            &times;
          </button>
        </div>
        {/* Modal content */}
        <div className="flex flex-col items-center">
          {contributor.avatar ? (
            <Image
              loader={customImageLoader}
              src={contributor.avatar}
              alt={contributor.name}
              className="mb-4 h-32 w-32 rounded-full object-cover"
              width={128}
              height={128}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          ) : (
            <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-blue-500">
              <span className="text-4xl font-semibold text-white">
                {getInitials(contributor.name)}
              </span>
            </div>
          )}
          <h2 className="mb-2 text-2xl font-bold text-gray-900 text-center">
            {contributor.name || 'Contributor'}
          </h2>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="mt-4 w-full px-6">
              <p className="mb-2 text-lg font-semibold text-gray-800">Links:</p>
              <div className="flex flex-col space-y-2">
                {socialLinks.map((link) =>
                  link.url ? (
                    <a
                      key={link.kind}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center space-x-2 text-gray-700 no-underline hover:font-semibold hover:text-gray-900"
                    >
                      <SocialIcon kind={link.kind} href={link.url} noLink />
                      <span className="text-md leading-none group-hover:text-gray-900">
                        {formatLinkText(link.kind, link.url)}
                      </span>
                    </a>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      </ReactModal>
    </>
  )
}

export default ContributorCard

