'use client'

import React from 'react'
import DonationStats from './DonationStats'
import Image from 'next/image'
import { AddressStats, BountyStatus } from '@/utils/types'
import { defaultAddressStats } from '@/utils/defaultValues'
import { customImageLoader } from '@/utils/customImageLoader'
import { isButtonDisabled, getButtonText } from '@/utils/statusHelpers'
import Button from '@/components/ui/Button'

type AsideSectionProps = {
  title: string
  coverImage: string
  addressStats?: AddressStats
  formatUSD?: (value: number | string) => string
  formatLits?: (value: number) => string
  litecoinRaised?: number
  litecoinPaid?: number
  isMatching?: boolean
  isBitcoinOlympics2024?: boolean
  isRecurring?: boolean
  matchingDonors?: any[]
  matchingTotal?: number
  monthlyTotal?: number
  recurringAmountGoal?: number
  monthlyDonorCount?: number
  timeLeftInMonth?: number
  serviceFeeCollected?: number
  bountyStatus?: BountyStatus
  totalPaid?: number
  openPaymentModal: () => void
}

const AsideSection: React.FC<AsideSectionProps> = ({
  title,
  coverImage,
  addressStats = defaultAddressStats,
  formatUSD = (v: number | string) => {
    const num = typeof v === 'string' ? Number(v) : v
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  },
  formatLits,
  litecoinRaised,
  litecoinPaid,
  bountyStatus,
  isMatching,
  isBitcoinOlympics2024,
  isRecurring,
  matchingDonors,
  matchingTotal,
  recurringAmountGoal,
  monthlyDonorCount,
  timeLeftInMonth,
  totalPaid,
  openPaymentModal,
}) => {
  return (
    <aside className="top-32 mb-8 flex min-w-[20rem] flex-col space-y-4 rounded-md bg-[#dddddd] p-4 lg:sticky lg:flex-col lg:space-x-4 lg:space-y-0">
      <div className="relative w-full max-w-full">
        <div className="relative aspect-video w-full min-h-[150px]">
          <Image
            loader={customImageLoader}
            src={coverImage}
            alt={title}
            fill
            className="rounded-sm"
            priority={true}
            decoding="async"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{
              objectFit: 'cover',
              objectPosition: '50% 50%',
            }}
          />
        </div>

        <div className="flex w-full flex-col pt-4">
          <DonationStats
            addressStats={addressStats}
            formatUSD={formatUSD}
            formatLits={formatLits}
            litecoinRaised={litecoinRaised}
            litecoinPaid={litecoinPaid}
            isBitcoinOlympics2024={isBitcoinOlympics2024}
            isRecurring={isRecurring}
            matchingDonors={matchingDonors}
            matchingTotal={matchingTotal}
            recurringAmountGoal={recurringAmountGoal}
            monthlyDonorCount={monthlyDonorCount}
            timeLeftInMonth={timeLeftInMonth}
            totalPaid={totalPaid}
          />
        </div>

        <div className="relative w-full pt-6">
          <Button
            onClick={openPaymentModal}
            variant="primary"
            className="block h-10 w-full"
            disabled={isButtonDisabled(bountyStatus)}
          >
            {getButtonText(bountyStatus)}
          </Button>
        </div>
      </div>
    </aside>
  )
}

export default AsideSection

