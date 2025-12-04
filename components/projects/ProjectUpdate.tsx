'use client'

import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronUp } from '@fortawesome/free-solid-svg-icons'

interface ProjectUpdateProps {
  title: string
  date: string
  content?: string
  tags: string[]
  summary: string
  authorTwitterHandle: string
  id: number
  highlight?: boolean
}

const ProjectUpdate: React.FC<ProjectUpdateProps> = ({
  title,
  date,
  content,
  summary,
  id,
  tags = [],
  authorTwitterHandle,
  highlight = false,
}) => {
  const [showContent, setShowContent] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const updateUrl = `${window.location.origin}${window.location.pathname}?updateId=${id}`
      navigator.clipboard
        .writeText(updateUrl)
        .then(() => {
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        })
        .catch((err) => console.error('Failed to copy the link: ', err))
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleCopyLink()
    }
  }

  const thickerBorderClass =
    showContent || highlight
      ? 'border-2 border-blue-200 dark:border-[#c6d3d6]'
      : ''

  return (
    <div
      className={`my-8 border border-[#eeeeee] bg-white p-4 ${thickerBorderClass}`}
    >
      <h6
        className="cursor-pointer text-sm text-gray-500 hover:text-blue-500 hover:underline"
        onClick={handleCopyLink}
        tabIndex={0}
        onKeyDown={handleKeyPress}
      >
        {isCopied ? 'Link Copied!' : `UPDATE #${id}`}
      </h6>
      <h2 className="text-xl font-semibold">{title}</h2>
      <h6 className="mb-4 text-gray-600">{date}</h6>
      <hr className="my-4 border-t border-gray-300" />
      <div className="content">
        {summary && <p className="markdown">{summary}</p>}
        {showContent && content && (
          <>
            <hr className="my-4 border-t border-gray-300" />
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              className="markdown"
            />
          </>
        )}
      </div>
      <div className="flex flex-wrap">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="mb-2 mr-2 rounded-full bg-blue-200 px-2 py-1 text-sm text-blue-800"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        {content && (
          <button onClick={() => setShowContent(!showContent)}>
            {showContent ? (
              <div className="flex items-center hover:text-blue-500 hover:underline">
                Read Less{' '}
                <FontAwesomeIcon icon={faChevronUp} className="ml-2 w-4" />
              </div>
            ) : (
              <div className="flex items-center hover:text-[#333333] hover:underline">
                Read More{' '}
                <FontAwesomeIcon icon={faChevronRight} className="ml-2 h-4" />
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProjectUpdate

