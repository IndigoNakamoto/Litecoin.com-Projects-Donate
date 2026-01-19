import { useEffect, useState } from 'react'
import { Project } from '@/types/project'
import { determineProjectType, determineBountyStatus } from '@/utils/statusHelpers'
import { isProject, isOpenBounty, isPastProject, isHidden } from '@/utils/projectFilters'
import { sortProjectsByDisplayOrder } from '@/utils/projectSorting'

interface FilteredProjects {
  openSourceProjects: Project[]
  completedProjects: Project[]
  openBounties: Project[]
}

/**
 * Custom hook to filter and categorize projects
 * Handles visibility filtering, status transformation, and categorization
 */
export function useProjectFiltering(projects: Project[]): FilteredProjects {
  const [openSourceProjects, setOpenSourceProjects] = useState<Project[]>([])
  const [completedProjects, setCompletedProjects] = useState<Project[]>([])
  const [openBounties, setOpenBounties] = useState<Project[]>([])

  useEffect(() => {
    // Filter out hidden projects
    const visibleProjects = projects.filter((p) => !isHidden(p))
    
    // Transform projects with type and bountyStatus
    const transformedProjects = visibleProjects.map((project) => ({
      ...project,
      type: determineProjectType(project.status),
      bountyStatus: determineBountyStatus(project.status),
    }))

    // Filter by category - ensure each project only appears in one category
    // Priority: Completed > Open Bounties > Open Projects
    // This prevents a project from appearing in multiple sections
    const completed = transformedProjects.filter(isPastProject)
    const bounties = transformedProjects.filter(p => isOpenBounty(p) && !isPastProject(p))
    const openProjects = transformedProjects.filter(p => isProject(p) && !isPastProject(p) && !isOpenBounty(p))
    
    // Debug logging for projects with "Completed" status
    if (process.env.NODE_ENV === 'development') {
      const completedStatusProjects = transformedProjects.filter(p => 
        p.status && (p.status.includes('Completed') || p.status.includes('Closed'))
      )
      if (completedStatusProjects.length > 0) {
        console.log('[useProjectFiltering] Projects with Completed/Closed status:', 
          completedStatusProjects.map(p => ({
            name: p.name,
            slug: p.slug,
            status: p.status,
            statusLength: p.status?.length,
            statusCharCodes: p.status?.split('').map(c => c.charCodeAt(0)),
            isPastProject: isPastProject(p),
            isProject: isProject(p),
            isOpenBounty: isOpenBounty(p)
          }))
        )
      }
      
      // Log any projects that don't match any filter
      const unmatchedProjects = transformedProjects.filter(p => 
        !isPastProject(p) && !isOpenBounty(p) && !isProject(p)
      )
      if (unmatchedProjects.length > 0) {
        console.warn('[useProjectFiltering] Projects that don\'t match any filter:', 
          unmatchedProjects.map(p => ({
            name: p.name,
            slug: p.slug,
            status: p.status
          }))
        )
      }
    }
    
    // Fallback: if no projects match filters, show all as open-source projects
    const allProjectsEmpty = openProjects.length === 0 && bounties.length === 0 && completed.length === 0
    const projectsToShow = allProjectsEmpty && visibleProjects.length > 0 
      ? transformedProjects 
      : openProjects

    if (allProjectsEmpty && visibleProjects.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('No projects matched filters. Showing all projects as open-source projects.')
    }

    // Sort and set state
    setOpenSourceProjects(sortProjectsByDisplayOrder(projectsToShow))
    setOpenBounties(bounties)
    setCompletedProjects(completed)
  }, [projects])

  return {
    openSourceProjects,
    completedProjects,
    openBounties,
  }
}

