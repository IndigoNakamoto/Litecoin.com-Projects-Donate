'use client'

import React, { useEffect, useState, useCallback } from 'react'
import ContributorCard from './ContributorCard'
import type { Contributor } from '@/types/project'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function SectionContributors() {
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContributors = useCallback(async () => {
    try {
      const response = await fetch('/api/contributors')
      if (!response.ok) {
        throw new Error('Failed to fetch contributors')
      }
      const data: Contributor[] = await response.json()
      const shuffledContributors = shuffleArray(data)
      setContributors(shuffledContributors)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching contributors:', error)
      setError('Failed to load contributors.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContributors()
  }, [fetchContributors])

  if (loading) {
    return <p>Loading contributors...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <div className="m-auto flex h-full w-full max-w-[1300px] flex-col items-center justify-center">
      <div className="contributors-list grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {contributors.map((contributor) => (
          <ContributorCard key={contributor.id} contributor={contributor} />
        ))}
      </div>
    </div>
  )
}

export default SectionContributors

