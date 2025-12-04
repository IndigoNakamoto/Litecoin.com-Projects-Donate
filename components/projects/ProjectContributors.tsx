'use client'

import React from 'react'
import type { Contributor } from '@/types/project'

type ProjectContributorsProps = {
  bitcoinContributors?: Contributor[]
  litecoinContributors?: Contributor[]
  advocates?: Contributor[]
}

const ProjectContributors: React.FC<ProjectContributorsProps> = ({
  bitcoinContributors = [],
  litecoinContributors = [],
  advocates = [],
}) => {
  const allContributors = [
    ...(bitcoinContributors || []),
    ...(litecoinContributors || []),
    ...(advocates || []),
  ]

  // Remove duplicates based on ID
  const uniqueContributors = allContributors.filter(
    (contributor, index, self) =>
      index === self.findIndex((c) => c.id === contributor.id)
  )

  if (uniqueContributors.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-2xl font-bold">Contributors</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {uniqueContributors.map((contributor) => (
          <div
            key={contributor.id}
            className="flex flex-col items-center justify-center p-2"
          >
            {contributor.avatar ? (
              <img
                src={contributor.avatar}
                alt={contributor.name || 'Contributor'}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                {contributor.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {contributor.name && (
              <p className="mt-2 text-center text-sm">{contributor.name}</p>
            )}
            {contributor.twitterLink && (
              <a
                href={contributor.twitterLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                Twitter
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectContributors

