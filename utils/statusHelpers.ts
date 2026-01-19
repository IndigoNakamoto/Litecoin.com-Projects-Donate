// utils/statusHelpers.ts
import { ProjectCategory, BountyStatus } from './types'

export function determineProjectType(status: string): ProjectCategory {
  if (status === 'Open') {
    return ProjectCategory.PROJECT
  } else if (
    status === 'Bounty Open' ||
    status === 'Bounty Closed' ||
    status === 'Completed' ||
    status === 'Closed' ||
    status === 'Bounty Completed'
  ) {
    return ProjectCategory.BOUNTY
  } else {
    return ProjectCategory.OTHER
  }
}

export function determineBountyStatus(
  status: string
): BountyStatus | undefined {
  switch (status) {
    case 'Bounty Open':
      return BountyStatus.OPEN
    case 'Closed':
      return BountyStatus.CLOSED
    case 'Bounty Closed':
      return BountyStatus.BOUNTY_CLOSED
    case 'Completed':
      return BountyStatus.COMPLETED
    case 'Bounty Completed':
      return BountyStatus.BOUNTY_COMPLETED
    default:
      return undefined
  }
}

export function isButtonDisabled(bountyStatus?: BountyStatus, projectStatus?: string): boolean {
  // Check bountyStatus first (legacy support)
  // Handle both enum value and string value for compatibility
  const bountyStatusValue = typeof bountyStatus === 'string' ? bountyStatus : bountyStatus
  if (
    bountyStatus === BountyStatus.COMPLETED ||
    bountyStatus === BountyStatus.BOUNTY_COMPLETED ||
    bountyStatus === BountyStatus.CLOSED ||
    bountyStatus === BountyStatus.BOUNTY_CLOSED ||
    bountyStatusValue === 'Completed' ||
    bountyStatusValue === 'Bounty Completed' ||
    bountyStatusValue === 'Closed' ||
    bountyStatusValue === 'Bounty Closed'
  ) {
    return true
  }
  
  // Also check project status directly (case-insensitive)
  if (projectStatus) {
    const normalizedStatus = projectStatus.toLowerCase().trim()
    if (
      normalizedStatus === 'completed' ||
      normalizedStatus === 'bounty completed' ||
      normalizedStatus === 'closed' ||
      normalizedStatus === 'bounty closed' ||
      normalizedStatus === 'archived'
    ) {
      return true
    }
  }
  
  return false
}

export function getButtonText(bountyStatus?: BountyStatus, projectStatus?: string): string {
  // Determine status from either source
  const normalizedStatus = projectStatus?.toLowerCase().trim() || ''
  const isCompleted = 
    bountyStatus === BountyStatus.COMPLETED ||
    bountyStatus === BountyStatus.BOUNTY_COMPLETED ||
    normalizedStatus === 'completed' ||
    normalizedStatus === 'bounty completed'
  
  const isClosed = 
    bountyStatus === BountyStatus.CLOSED ||
    bountyStatus === BountyStatus.BOUNTY_CLOSED ||
    normalizedStatus === 'closed' ||
    normalizedStatus === 'bounty closed' ||
    normalizedStatus === 'archived'
  
  if (isCompleted) {
    return 'PROJECT COMPLETED'
  } else if (isClosed) {
    return 'PROJECT CLOSED'
  } else {
    return 'DONATE'
  }
}

