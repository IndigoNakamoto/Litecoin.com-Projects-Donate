'use client'

import React from 'react'

export type FundingTargetProgressProps = {
  /** Total raised (community + matched USD), already rounded to cents */
  current: number
  /** Funding goal in USD */
  target: number
  formatUSD: (value: number) => string
}

export default function FundingTargetProgress({
  current,
  target,
  formatUSD,
}: FundingTargetProgressProps) {
  const safeTarget = target > 0 ? target : 1
  const rawPercent = (current / safeTarget) * 100
  const fillPercent = Math.min(100, rawPercent)
  const pctWhole = Math.round(fillPercent)

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-1.5 w-full overflow-hidden rounded-sm bg-gray-300/90"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pctWhole}
        aria-label={`Funding progress: ${pctWhole} percent of $ ${formatUSD(target)} goal`}
      >
        <div
          className="h-full rounded-sm bg-[#345D9D]"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <p className="text-xs text-gray-600">
        {pctWhole}% of $ {formatUSD(target)} goal
      </p>
    </div>
  )
}
