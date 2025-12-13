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
  const trimmedStatus = status.trim()
  
  return [
    'Bounty Closed', 
    'Bounty Completed', 
    'Closed', 
    'Completed'
  ].includes(trimmedStatus)
}

/**
 * Checks if a project should be hidden from display
 */
export function isHidden(project: Project): boolean {
  return project.hidden === true
}

