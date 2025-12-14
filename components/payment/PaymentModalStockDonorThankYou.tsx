'use client'

// /components/PaymentModalStockDonorThankYou
import React from 'react'
import { useDonation } from '@/contexts/DonationContext'

interface PaymentModalStockDonorThankYouProps {
  onRequestClose?: () => void
}

export default function PaymentModalStockDonorThankYou({
  onRequestClose,
}: PaymentModalStockDonorThankYouProps) {
  const { state } = useDonation()

  // Extract necessary details from the state
  const projectTitle = state.projectTitle || 'your selected project'
  const donatedStock = state.formData.assetSymbol || 'N/A'
  const stockQuantity = state.formData.pledgeAmount || '0'
  const donorName = state.formData.isAnonymous
    ? 'Anonymous Donor'
    : `${state.formData.firstName} ${state.formData.lastName}`
  const brokerName = state.formData.brokerLabelName || 'N/A'
  const brokerContactName = state.formData.brokerContactName || 'N/A'
  const brokerageAccountNumber = state.formData.brokerageAccountNumber || 'N/A'
  const signatureImage = state.formData.signatureImage || ''

  // Format the signature date
  const signatureDate = state.formData.signatureDate
    ? new Date(state.formData.signatureDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Pending'

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6 rounded-lg p-0 md:p-8">
      <h2 className="text-[30px] font-[600] !text-[#222222]">Thank You for Your Donation!</h2>
      <hr className="border-t-1 w-full border-gray-400" />
      <div className="">
        <p className=" text-black">
          Your generous donation has been sent to your broker {brokerName} to
          process the donation.
          <div className="my-4">
            <p className=" text-black">
              <span className="font-semibold">Project:</span> {projectTitle}
            </p>
            <p className=" text-black">
              <span className="font-semibold">Donated Stock:</span>{' '}
              {donatedStock}
            </p>
            <p className=" text-black">
              <span className="font-semibold">Amount:</span> {stockQuantity}{' '}
              shares
            </p>
            <p className=" text-black">
              <span className="font-semibold">Broker Account:</span>{' '}
              {brokerageAccountNumber}
            </p>
          </div>
          <p className=" text-black">
            You will receive a confirmation email with your tax receipt once
            your donation is processed.
          </p>
        </p>
      </div>
    </div>
  )
}

