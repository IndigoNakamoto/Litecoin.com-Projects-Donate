'use client'

// components/PaymentModal.tsx

import React, { useEffect } from 'react'
import ReactModal from 'react-modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClose } from '@fortawesome/free-solid-svg-icons'
import PaymentForm from './PaymentForm'
import { Project } from '@/types/project'
import { useDonation } from '@/contexts/DonationContext'

type ModalProps = {
  isOpen: boolean
  onRequestClose: () => void
  project: Project | undefined
}

const PaymentModal: React.FC<ModalProps> = ({
  isOpen,
  onRequestClose,
  project,
}) => {
  const { state, dispatch } = useDonation()

  useEffect(() => {
    if (project) {
      dispatch({
        type: 'SET_PROJECT_DETAILS',
        payload: {
          slug: project.slug,
          title: project.name, // Project uses 'name' instead of 'title'
          image: project.coverImage || '',
        },
      })
    }
  }, [project, dispatch])

  const handleClose = () => {
    dispatch({ type: 'RESET_DONATION_STATE' })
    onRequestClose()

    // Check if window is defined and if social auth was used
    // Note: signOut functionality removed as next-auth is not installed
    // If authentication is needed, install next-auth and uncomment:
    // if (
    //   typeof window !== 'undefined' &&
    //   (state.formData.socialX ||
    //     state.formData.socialFacebook ||
    //     state.formData.socialLinkedIn)
    // ) {
    //   const currentUrl = window.location.href
    //   const url = new URL(currentUrl)
    //   url.searchParams.set('modal', 'false')
    //   signOut({ callbackUrl: url.toString() })
    // }
  }

  // Only render the modal and PaymentForm when isOpen is true
  if (!isOpen) return null

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      ariaHideApp={false}
      className="h-full max-h-[98vh] min-h-[50vh] max-w-[44rem] overflow-y-auto overflow-x-hidden border border-black bg-[#f0f0f0] p-8 shadow-xl sm:m-8 sm:h-min sm:w-full md:p-16"
      overlayClassName="fixed inset-0 bg-black/70 z-[40] flex items-center justify-center transform duration-400 ease-in"
    >
      <div className="relative flex justify-end text-[#f46748]">
        <FontAwesomeIcon
          key="close-icon"
          icon={faClose}
          className="hover:text-primary h-[2rem] w-[2rem] cursor-pointer"
          onClick={handleClose}
        />
      </div>
      <PaymentForm project={project} modal={true} />
    </ReactModal>
  )
}

export default PaymentModal

