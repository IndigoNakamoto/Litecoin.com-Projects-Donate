'use client'

import React, { useEffect, useState, useCallback } from 'react'

interface Stats {
  projectsSupported: string
  totalPaid: string | null
  donationsRaised: string | null
  donationsMatched: string | null
}

function SectionStats() {
  const [stats, setStats] = useState<Stats>({
    projectsSupported: '0',
    totalPaid: null,
    donationsRaised: null,
    donationsMatched: null,
  })

  const fetchStats = useCallback(async () => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    })

    try {
      const response = await fetch('/api/stats', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats({
        projectsSupported: data.projectsSupported?.toString() || '0',
        totalPaid:
          data.totalPaid !== undefined && data.totalPaid !== null
            ? formatter.format(data.totalPaid)
            : null,
        donationsRaised:
          data.donationsRaised !== undefined && data.donationsRaised !== null
            ? formatter.format(data.donationsRaised)
            : null,
        donationsMatched:
          data.donationsMatched !== undefined && data.donationsMatched !== null
            ? formatter.format(Number(data.donationsMatched))
            : null,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        projectsSupported: 'N/A',
        totalPaid: 'N/A',
        donationsRaised: 'N/A',
        donationsMatched: 'N/A',
      })
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="mx-auto max-w-5xl text-center text-black">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div className="flex flex-col items-center">
          <div className="font-space-grotesk text-3xl font-semibold md:text-3xl lg:text-4xl">
            {stats.projectsSupported}
          </div>
          <p className="text-[13px] uppercase">Projects Supported</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="font-space-grotesk text-3xl font-semibold md:text-3xl lg:text-4xl">
            {stats.totalPaid !== null ? stats.totalPaid : '$0.00'}
          </div>
          <p className="text-[13px] uppercase">Paid to Contributors</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="font-space-grotesk text-3xl font-semibold md:text-3xl lg:text-4xl">
            {stats.donationsRaised !== null ? stats.donationsRaised : '$0.00'}
          </div>
          <p className="text-[13px] uppercase">Donations Raised</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="font-space-grotesk text-3xl font-semibold md:text-3xl lg:text-4xl">
            {stats.donationsMatched !== null ? stats.donationsMatched : '$0.00'}
          </div>
          <p className="text-[13px] uppercase">Donations Matched</p>
        </div>
      </div>
    </div>
  )
}

export default SectionStats

