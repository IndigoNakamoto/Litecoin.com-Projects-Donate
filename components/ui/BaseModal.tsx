'use client'

import React, { useEffect } from 'react'
import ReactModal from 'react-modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClose } from '@fortawesome/free-solid-svg-icons'

export interface BaseModalProps {
  isOpen: boolean
  onRequestClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  overlayClassName?: string
  shouldCloseOnOverlayClick?: boolean
  shouldCloseOnEsc?: boolean
  maxWidth?: string
  showCloseButton?: boolean
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onRequestClose,
  title,
  children,
  className = '',
  overlayClassName = '',
  shouldCloseOnOverlayClick = true,
  shouldCloseOnEsc = true,
  maxWidth = '44rem',
  showCloseButton = true,
}) => {
  // Set app element for accessibility (only on client side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ReactModal.setAppElement('body')
    }
  }, [])

  // Only render the modal when isOpen is true
  if (!isOpen) return null

  const defaultClassName = `h-full max-h-[98vh] min-h-[50vh] max-w-[${maxWidth}] overflow-y-auto overflow-x-hidden border border-black bg-[#f0f0f0] p-8 shadow-xl sm:m-8 sm:h-min sm:w-full md:p-16`
  const defaultOverlayClassName = 'fixed inset-0 bg-[#222222] bg-opacity-80 z-[40] flex items-center justify-center transform duration-400 ease-in'

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      shouldCloseOnEsc={shouldCloseOnEsc}
      className={className || defaultClassName}
      overlayClassName={overlayClassName || defaultOverlayClassName}
      contentLabel={title || 'Modal'}
    >
      <div className="relative">
        {title && (
          <h2 className="mb-4 font-space-grotesk text-2xl font-semibold text-black">
            {title}
          </h2>
        )}
        {showCloseButton && (
          <div className="absolute right-0 top-0 flex justify-end text-[#f46748]">
            <FontAwesomeIcon
              icon={faClose}
              className="hover:text-primary h-[2rem] w-[2rem] cursor-pointer"
              onClick={onRequestClose}
              aria-label="Close modal"
            />
          </div>
        )}
        <div className={title ? 'mt-8' : ''}>{children}</div>
      </div>
    </ReactModal>
  )
}

export default BaseModal

