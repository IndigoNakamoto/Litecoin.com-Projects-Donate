import { Metadata } from 'next'
import SubmittedSection from '@/components/ui/SubmittedSection'

export const metadata: Metadata = {
  title: 'Litecoin.com | Project Submitted',
  description:
    'Thank you for submitting your project to Litecoin.com. We will review your application shortly.',
}

export default function SubmittedPage() {
  return (
    <SubmittedSection title="Thank You for Your Submission!">
      <div className="my-auto mt-10 max-w-2xl space-y-8 text-center xs:my-4">
        <p className='text-[#404040]'>
          We&apos;ve received your project submission and are excited to review
          your application. The Litecoin Foundation appreciates your
          initiative and your commitment to strengthening the Litecoin
          ecosystem.
        </p>
        <p className='text-[#404040]'>
          Our team will carefully review the details you&apos;ve provided. Please note
          that due to the volume of submissions, we may not be able to respond
          to all applications. We&apos;ll reach out if we have any questions or if
          your project is selected for further consideration.
        </p>
      </div>
    </SubmittedSection>
  )
}

