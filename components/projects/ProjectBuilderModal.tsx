'use client'

import React, { useState } from 'react'
import BaseModal from '@/components/ui/BaseModal'
import ProjectSubmissionForm from './ProjectSubmissionForm'
import { ProjectItem } from '@/utils/types'

export interface ProjectBuilderModalProps {
  isOpen: boolean
  onRequestClose: () => void
  project?: ProjectItem | null
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  onError?: (error: string) => void
}

const ProjectBuilderModal: React.FC<ProjectBuilderModalProps> = ({
  isOpen,
  onRequestClose,
  project = null,
  mode = 'create',
  onSuccess,
  onError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    if (!isSubmitting) {
      onRequestClose()
    }
  }

  const handleFormSuccess = () => {
    if (onSuccess) {
      onSuccess()
    }
    // Close modal after a short delay to allow success state to be visible
    setTimeout(() => {
      onRequestClose()
    }, 1500)
  }

  const modalTitle = mode === 'edit' ? 'Edit Project' : 'Create New Project'

  return (
    <BaseModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      title={modalTitle}
      maxWidth="56rem"
      shouldCloseOnOverlayClick={!isSubmitting}
      shouldCloseOnEsc={!isSubmitting}
    >
      <div className="project-builder-modal-content">
        <ProjectSubmissionForm />
      </div>
    </BaseModal>
  )
}

export default ProjectBuilderModal

