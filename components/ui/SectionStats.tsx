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

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats({
        projectsSupported: data.projectsSupported?.toString() || '0',
        totalPaid: data.totalPaid ? formatter.format(data.totalPaid) : null,
        donationsRaised: data.donationsRaised
          ? formatter.format(data.donationsRaised)
          : null,
        donationsMatched: data.donationsMatched
          ? formatter.format(data.donationsMatched)
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
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      <div className="text-center">
        <h3 className="font-space-grotesk text-3xl font-bold text-[#222222]">
          {stats.projectsSupported}
        </h3>
        <p className="text-[16px] text-[#000000]">Projects Supported</p>
      </div>
      {stats.totalPaid && (
        <div className="text-center">
          <h3 className="font-space-grotesk text-3xl font-bold text-[#222222]">
            {stats.totalPaid}
          </h3>
          <p className="text-[16px] text-[#000000]">Total Paid</p>
        </div>
      )}
      {stats.donationsRaised && (
        <div className="text-center">
          <h3 className="font-space-grotesk text-3xl font-bold text-[#222222]">
            {stats.donationsRaised}
          </h3>
          <p className="text-[16px] text-[#000000]">Donations Raised</p>
        </div>
      )}
      {stats.donationsMatched && (
        <div className="text-center">
          <h3 className="font-space-grotesk text-3xl font-bold text-[#222222]">
            {stats.donationsMatched}
          </h3>
          <p className="text-[16px] text-[#000000]">Donations Matched</p>
        </div>
      )}
    </div>
  )
}

export default SectionStats

