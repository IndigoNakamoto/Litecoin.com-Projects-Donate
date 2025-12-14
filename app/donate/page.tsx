'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DonateSection from '@/components/ui/DonateSection'
import SectionMatchingDonations from '@/components/ui/SectionMatchingDonations'
import SectionWhite from '@/components/ui/SectionWhite'
import SectionBlue from '@/components/ui/SectionBlue'
import SectionGrey from '@/components/ui/SectionGrey'
import SectionStats from '@/components/ui/SectionStats'
import CompletedProjects from '@/components/ui/CompletedProjects'
import { useDonation } from '@/contexts/DonationContext'
import PaymentForm from '@/components/payment/PaymentForm'
import { Project } from '@/types/project'

function ResetHandler() {
  const { dispatch } = useDonation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const reset = searchParams.get('reset')

  useEffect(() => {
    if (reset === 'true') {
      dispatch({ type: 'RESET_DONATION_STATE' })
      // Remove the reset parameter from the URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('reset')
      router.replace(newUrl.pathname + newUrl.search)
    }
  }, [dispatch, reset, router])

  return null
}

function DonatePageContent() {
  const litecoinFoundationProject: Project = {
    id: 'litecoin-foundation',
    name: 'Litecoin Foundation',
    slug: 'litecoin-foundation',
    summary: '',
    content: '',
    coverImage: '/static/images/projects/Litecoin_Foundation_Project.png',
    status: 'active',
    projectType: 'foundation',
    hidden: false,
    recurring: false,
    totalPaid: 0,
    serviceFeesCollected: 0,
    website: '',
    github: '',
    twitter: '',
    discord: '',
    telegram: '',
    reddit: '',
    facebook: '',
    lastPublished: '',
    lastUpdated: '',
    createdOn: '',
    bitcoinContributors: [],
    litecoinContributors: [],
    advocates: [],
    litecoinRaised: 0,
    litecoinPaid: 0,
  }

  return (
    <>
      <DonateSection title="">
        <div className="mx-auto flex w-full flex-col items-center justify-between xl:flex-row xl:items-start">
          <div className="max-w-[600px] flex-1 pr-0 xl:pr-6">
            <h1 className="font-space-grotesk text-4xl font-bold text-[#222222]">
              Support the Future of Litecoin: Donate Today
            </h1>
            <div>
              <p className="mt-6 text-lg text-[#222222]">
                Litecoin Foundation Inc. is a 501(c)(3) nonprofit organization
                whose mission is to promote the adoption, awareness &
                development of Litecoin & its ecosystem.
              </p>
              <p className="mt-4 text-lg text-[#222222]">
                Since Litecoin is a fairly launched, decentralized
                cryptocurrency, Litecoin Foundation&apos;s primary source of
                financial support is through individual donations. Your
                contribution helps Litecoin Foundation continue to fund research
                and development, education, community support, partnerships and
                advocacy related to Litecoin, cryptocurrency and financial
                privacy.
              </p>
              <p className="mt-4 text-lg text-[#222222]">
                Your contribution may also reduce your taxable income, depending
                on your tax situation. If you have any questions, please feel
                free to consult with your tax advisor to ensure you&apos;re getting
                the full benefit of your charitable donation.
              </p>
            </div>
          </div>
          <div className="mt-12 w-full max-w-[600px] flex-none rounded-2xl border border-[#222222] bg-gray-100 p-6 xl:mt-0">
            <PaymentForm project={litecoinFoundationProject} modal={true} />
          </div>
        </div>
      </DonateSection>
      <SectionGrey>
        <SectionStats />
      </SectionGrey>
      <SectionBlue>
        <SectionMatchingDonations />
      </SectionBlue>
      <SectionWhite>
        <div className="min-w-full">
          <CompletedProjects />
        </div>
      </SectionWhite>
    </>
  )
}

export default function DonatePage() {
  return (
    <Suspense fallback={null}>
      <ResetHandler />
      <DonatePageContent />
    </Suspense>
  )
}

