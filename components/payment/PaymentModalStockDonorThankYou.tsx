'use client'

// /components/PaymentModalStockDonorThankYou
import React from 'react'
import { useDonation } from '@/contexts/DonationContext'
import GradientButton from '@/components/ui/GradientButton'

export default function PaymentModalStockDonorThankYou() {
  const { state, dispatch } = useDonation()

  // Extract necessary details from the state
  const projectTitle = state.projectTitle || 'your selected project'
  const donatedStock = state.formData.assetSymbol || 'N/A'
  const stockQuantity = state.formData.pledgeAmount || '0'
  const brokerName = state.formData.brokerLabelName || 'N/A'
  const brokerageAccountNumber = state.formData.brokerageAccountNumber || 'N/A'

  const handleMakeAnotherDonation = () => {
    dispatch({ type: 'RESET_DONATION_STATE' })
    // Do NOT call onRequestClose; we want to go back to the start of the PaymentForm flow.
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6 rounded-lg p-0 md:p-8">
      <h2 className="text-[30px] font-semibold text-[#222222]!">
        Thank You for Your Donation!
      </h2>
      <hr className="w-full border-t border-gray-400" />
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

      <GradientButton
        onClick={handleMakeAnotherDonation}
        isLoading={false}
        disabled={false}
        type="button"
      >
        MAKE ANOTHER DONATION
      </GradientButton>
    </div>
  )
}

