'use client'

import { useState } from 'react'
import ProjectHeader from './ProjectHeader'
import ProjectMenu from './ProjectMenu'
import MenuSections from './MenuSections'
import AsideSection from './AsideSection'
import { Project } from '@/types/project'
import { AddressStats, BountyStatus } from '@/utils/types'
import { defaultAddressStats } from '@/utils/defaultValues'
import { determineBountyStatus } from '@/utils/statusHelpers'

type ProjectDetailClientProps = {
  project: Project
  addressStats?: AddressStats
  faqs?: any[]
  updates?: any[]
  posts?: any[]
}

export default function ProjectDetailClient({
  project,
  addressStats = defaultAddressStats,
  faqs = [],
  updates = [],
  posts = [],
}: ProjectDetailClientProps) {
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('Info')
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null)

  const formatUSD = (value: any) => {
    const num = Number(value)
    if (isNaN(num) || value === '' || value === null) {
      return '0.00'
    }
    if (num === 0) {
      return '0.00'
    }
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatLits = (value: number) => {
    return value.toFixed(2)
  }

  const bountyStatus = determineBountyStatus(project.status)

  const openPaymentModal = () => {
    // TODO: Implement payment modal
    console.log('Open payment modal for', project.slug)
  }

  return (
    <div className="flex h-full w-screen max-w-none items-center bg-[#f2f2f2] bg-cover bg-center pb-8">
      <article className="relative mx-auto mt-32 flex min-h-screen w-[1300px] max-w-[90%] flex-col-reverse pb-16 lg:flex-row lg:items-start">
        <div className="content w-full leading-relaxed text-gray-800 lg:mr-5">
          <ProjectHeader title={project.name} summary={project.summary} />

          <ProjectMenu
            onMenuItemChange={setSelectedMenuItem}
            activeMenu={selectedMenuItem}
            commentCount={posts.length}
            faqCount={faqs.length}
            updatesCount={updates.length}
          />

          <div>
            <MenuSections
              selectedMenuItem={selectedMenuItem}
              title={project.name}
              content={project.content || ''}
              socialSummary={project.summary}
              faq={faqs}
              faqCount={faqs.length}
              updates={updates}
              selectedUpdateId={selectedUpdateId}
              setSelectedUpdateId={setSelectedUpdateId}
              hashtag=""
              tweetsData={posts}
              twitterContributors={[]}
              twitterContributorsBitcoin={project.bitcoinContributors || []}
              twitterContributorsLitecoin={project.litecoinContributors || []}
              twitterAdvocates={project.advocates || []}
              twitterUsers={[]}
              isBitcoinOlympics2024={false}
              formatLits={formatLits}
              formatUSD={formatUSD}
              website={project.website || ''}
              gitRepository={project.github || ''}
              twitterHandle={project.twitter || ''}
              discordLink={project.discord || ''}
              telegramLink={project.telegram || ''}
              facebookLink={project.facebook || ''}
              redditLink={project.reddit || ''}
            />
          </div>
        </div>

        <AsideSection
          title={project.name}
          coverImage={project.coverImage || ''}
          addressStats={addressStats}
          formatUSD={formatUSD}
          formatLits={formatLits}
          litecoinRaised={0}
          litecoinPaid={0}
          isMatching={false}
          isBitcoinOlympics2024={false}
          isRecurring={project.recurring}
          matchingDonors={[]}
          matchingTotal={0}
          monthlyTotal={0}
          recurringAmountGoal={0}
          monthlyDonorCount={0}
          timeLeftInMonth={0}
          serviceFeeCollected={project.serviceFeesCollected}
          bountyStatus={bountyStatus}
          totalPaid={project.totalPaid}
          openPaymentModal={openPaymentModal}
        />
      </article>
    </div>
  )
}

