import { Project } from '@/types/project'

/**
 * Filter functions for categorizing projects based on status field.
 * 
 * Status values must match exactly (case-sensitive) as defined in Webflow CMS:
 * - "Open" → Open-Source Projects
 * - "Bounty Open" → Open Bounties  
 * - "Bounty Closed", "Bounty Completed", "Closed", "Completed" → Completed Projects
 * 
 * See: ADDING_NEW_PROJECT.md for complete status documentation
 */

/**
 * Checks if a project is an open-source project (status === "Open")
 */
export function isProject(project: Project): boolean {
  return project.status === 'Open'
}

/**
 * Checks if a project is an open bounty (status === "Bounty Open")
 */
export function isOpenBounty(project: Project): boolean {
  return project.status === 'Bounty Open'
}

/**
 * Checks if a project is completed/closed
 * Matches: "Bounty Closed", "Bounty Completed", "Closed", "Completed"
 */
export function isPastProject(project: Project): boolean {
  const status = project.status || ''
  // Normalize: trim whitespace and handle potential encoding issues
  const normalizedStatus = status.trim().replace(/\s+/g, ' ')
  
  const completedStatuses = [
    'Bounty Closed', 
    'Bounty Completed', 
    'Closed', 
    'Completed'
  ]
  
  const isMatch = completedStatuses.includes(normalizedStatus)
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && status && !isMatch) {
    // Check if it's close to a match (for debugging)
    const lowerStatus = normalizedStatus.toLowerCase()
    const lowerCompleted = completedStatuses.map(s => s.toLowerCase())
    if (lowerCompleted.some(s => lowerStatus.includes(s) || s.includes(lowerStatus))) {
      console.warn(`[isPastProject] Status "${status}" (normalized: "${normalizedStatus}") is close to a completed status but doesn't match exactly.`, {
        status,
        normalizedStatus,
        charCodes: normalizedStatus.split('').map(c => c.charCodeAt(0)),
        length: normalizedStatus.length
      })
    }
  }
  
  return isMatch
}

/**
 * Checks if a project should be hidden from display
 */
export function isHidden(project: Project): boolean {
  return project.hidden === true
}

