'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDonation } from '@/contexts/DonationContext'
import ProjectCard from './ProjectCard'
import VerticalSocialIcons from '@/components/ui/VerticalSocialIcons'
import SectionGrey from '@/components/ui/SectionGrey'
import SectionWhite from '@/components/ui/SectionWhite'
import SectionBlue from '@/components/ui/SectionBlue'
import SectionStats from '@/components/ui/SectionStats'
import SectionMatchingDonations from '@/components/ui/SectionMatchingDonations'
import SectionContributors from '@/components/ui/SectionContributors'
import TypingScroll from '@/components/ui/TypingScroll'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { Project } from '@/types/project'
import { ProjectCategory, BountyStatus } from '@/utils/types'
import { determineProjectType, determineBountyStatus } from '@/utils/statusHelpers'

type ProjectsPageClientProps = {
  projects: Project[]
}

function useIsLgScreen() {
  const [isLgScreen, setIsLgScreen] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleResize = () => {
      setIsLgScreen(mediaQuery.matches)
    }
    handleResize()
    mediaQuery.addEventListener('change', handleResize)
    return () => {
      mediaQuery.removeEventListener('change', handleResize)
    }
  }, [])

  return isLgScreen
}

export default function ProjectsPageClient({ projects }: ProjectsPageClientProps) {
  const router = useRouter()
  const { dispatch } = useDonation()
  const [openSourceProjects, setOpenSourceProjects] = useState<Project[]>([])
  const [completedProjects, setCompletedProjects] = useState<Project[]>([])
  const [openBounties, setOpenBounties] = useState<Project[]>([])

  const outerSpinnerRef = useRef<HTMLImageElement>(null)
  const innerSpinnerRef = useRef<HTMLImageElement>(null)
  const isLgScreen = useIsLgScreen()

  const projectsRef = useRef<HTMLDivElement>(null)
  const bountiesRef = useRef<HTMLDivElement>(null)

  const project = {
    slug: 'litecoin-foundation',
    name: 'Litecoin Foundation',
    summary: '',
    coverImage: '/static/images/projects/Litecoin_Foundation_Project.png',
    telegram: '',
    reddit: '',
    facebook: '',
    status: 'Open',
    hidden: false,
    recurring: false,
    totalPaid: 0,
    serviceFeesCollected: 0,
  }

  useEffect(() => {
    // Filter out hidden projects - handle both boolean true and string "true"
    const visibleProjects = projects.filter((p) => {
      const isHidden = p.hidden === true || p.hidden === 'true' || p.hidden === 1
      return !isHidden
    })
    
    // Debug: log project statuses to see what we're working with
    console.log('=== PROJECT FILTERING DEBUG ===')
    console.log('Total projects from API:', projects.length)
    console.log('Hidden projects:', projects.filter(p => p.hidden === true || p.hidden === 'true' || p.hidden === 1).map(p => p.name))
    console.log('Visible projects (not hidden):', visibleProjects.length)
    console.log('All projects with details:', projects.map(p => ({ 
      name: p.name, 
      status: p.status,
      statusType: typeof p.status,
      hidden: p.hidden,
      hiddenType: typeof p.hidden
    })))
    console.log('All visible projects:', visibleProjects.map(p => ({ 
      name: p.name, 
      status: p.status,
      statusType: typeof p.status
    })))
    
    const transformedProjects = visibleProjects.map((project) => ({
      ...project,
      type: determineProjectType(project.status),
      bountyStatus: determineBountyStatus(project.status),
    }))

    const desiredOrder = [
      'Litecoin Foundation',
      'Litecoin Core',
      'MWEB',
      'Ordinals Lite',
      'Litewallet',
      'Litecoin Development Kit',
      'Litecoin Mempool Explorer',
    ]

    const openProjects = transformedProjects.filter(isProject)
    const bounties = transformedProjects.filter(isOpenBounty)
    const completed = transformedProjects.filter(isPastProject)
    
    // Debug: Show which projects match which filters
    console.log('=== FILTER RESULTS ===')
    console.log('Open projects (status="Open"):', openProjects.length)
    openProjects.forEach(p => console.log('  -', p.name, '| status:', JSON.stringify(p.status)))
    
    console.log('Bounties (status="Bounty Open"):', bounties.length)
    bounties.forEach(p => console.log('  -', p.name, '| status:', JSON.stringify(p.status)))
    
    console.log('Completed projects:', completed.length)
    completed.forEach(p => console.log('  -', p.name, '| status:', JSON.stringify(p.status)))
    
    // Show projects that don't match any filter
    const unmatchedProjects = transformedProjects.filter(p => 
      !isProject(p) && !isOpenBounty(p) && !isPastProject(p)
    )
    if (unmatchedProjects.length > 0) {
      console.log('⚠️ Projects that don\'t match any filter:', unmatchedProjects.length)
      unmatchedProjects.forEach(p => console.log('  -', p.name, '| status:', JSON.stringify(p.status), '| type:', typeof p.status))
    }
    
    // If no projects match filters, show all projects as open-source projects
    const allProjectsEmpty = openProjects.length === 0 && bounties.length === 0 && completed.length === 0
    
    if (allProjectsEmpty && visibleProjects.length > 0) {
      console.warn('No projects matched filters. Showing all projects as open-source projects.')
    }

    // If no projects matched filters, show all projects as open-source projects
    const projectsToShow = allProjectsEmpty && visibleProjects.length > 0 
      ? transformedProjects 
      : openProjects

    setOpenSourceProjects(
      projectsToShow.sort((a, b) => {
        const indexA = desiredOrder.indexOf(a.name)
        const indexB = desiredOrder.indexOf(b.name)

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.name.localeCompare(b.name)
      })
    )

    setOpenBounties(bounties)
    setCompletedProjects(completed)
  }, [projects])

  useEffect(() => {
    let previousScrollY = window.scrollY
    let rotationAngle = 0

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - previousScrollY
      rotationAngle += scrollDelta * 0.08
      if (outerSpinnerRef.current) {
        outerSpinnerRef.current.style.transform = `rotate(${rotationAngle}deg)`
      }
      previousScrollY = currentScrollY
    }

    let requestId: number
    const animate = () => {
      requestId = requestAnimationFrame(animate)
      handleScroll()
    }
    animate()
    return () => {
      cancelAnimationFrame(requestId)
    }
  }, [])

  useEffect(() => {
    if (innerSpinnerRef.current) {
      innerSpinnerRef.current.style.width = '80%'
      innerSpinnerRef.current.style.height = '80%'
    }
  }, [])

  const openPaymentModal = useCallback(() => {
    dispatch({
      type: 'SET_PROJECT_DETAILS',
      payload: {
        slug: project.slug,
        title: project.name,
        image: project.coverImage || '',
      },
    })
    router.push(`/projects?modal=true`)
  }, [dispatch, router])

  const scrollToProjects = () => {
    const yOffset = -64
    const yPosition =
      (projectsRef.current?.getBoundingClientRect().top ?? 0) +
      window.scrollY +
      yOffset
    window.scrollTo({ top: yPosition, behavior: 'smooth' })
  }

  const scrollToBounties = () => {
    const yOffset = -64
    const yPosition =
      (bountiesRef.current?.getBoundingClientRect().top ?? 0) +
      window.scrollY +
      yOffset
    window.scrollTo({ top: yPosition, behavior: 'smooth' })
  }

  const bgColors = useMemo(() => ['bg-[#EEEEEE]', 'bg-[#c6d3d6]'], [])

  return (
    <div className="w-full overflow-x-hidden">
      <VerticalSocialIcons />
      <section
        className="relative flex max-h-fit min-h-[62vh] w-full items-center overflow-x-hidden bg-cover bg-center lg:py-24"
        style={{
          backgroundImage: "url('/static/images/design/Mask-Group-20.webp')",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
        }}
      >
        <div className="w-full items-center">
          <div className="m-auto flex h-full w-[1300px] max-w-[90%] flex-col-reverse justify-center gap-y-40 lg:flex-row lg:items-center">
            <div className="lg:py-30 py-20 lg:w-1/2">
              <h1 className="font-space-grotesk text-[39px] font-semibold leading-[32px] tracking-tight text-black">
                Litecoin Projects
              </h1>
              <p className="w-11/12 pt-6 text-[18px]">
                The Litecoin Foundation is dedicated to consistently improving
                the Litecoin network, whilst supporting the development of
                exciting projects on the Litecoin blockchain. Below are a
                handful of initiatives that demonstrate Litecoin's commitment to
                innovation and improving the experience of its users.
              </p>
              <div className="my-8 flex w-11/12 max-w-[508px] flex-col gap-4">
                <div className="">
                  <Button
                    variant="primary"
                    onClick={openPaymentModal}
                    className="h-12 w-full px-6 py-1 !tracking-wide"
                  >
                    DONATE NOW
                  </Button>
                </div>

                <div className="flex w-full flex-row justify-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={scrollToProjects}
                    className="w-full px-6 py-3"
                  >
                    VIEW PROJECTS
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={scrollToBounties}
                    className="w-full px-6 py-3"
                  >
                    VIEW PAST PROJECTS
                  </Button>
                </div>
              </div>
            </div>
            <div className="w-7/12 pt-80 lg:w-1/2 lg:pb-0 lg:pl-20 lg:pt-0">
              <div className="relative flex items-center justify-center">
                <img
                  src="/static/images/design/outline-litecoin-spinner-inner.svg"
                  alt="Litecoin Spinner Inner"
                  ref={innerSpinnerRef}
                  className="absolute w-1/2 max-w-[160px] pb-8 lg:max-w-[full]"
                />
                <img
                  src="/static/images/design/outline-litecoin-spinner-outer.svg"
                  alt="Litecoin Spinner Outer"
                  ref={outerSpinnerRef}
                  className="absolute w-full lg:w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionWhite>
        <div className="py-2">
          <SectionStats />
        </div>
      </SectionWhite>

      <SectionBlue>
        <SectionMatchingDonations />
      </SectionBlue>

      {/* OPEN SOURCE PROJECTS */}
      <SectionGrey>
        <div ref={projectsRef} className="flex flex-col items-center">
          <h1 className="w-full pb-8 pt-8 font-space-grotesk !text-[30px] font-semibold leading-tight tracking-tight text-black">
            Open-Source Projects
          </h1>
          {openSourceProjects.length > 0 ? (
            <ul className="grid max-w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {openSourceProjects.map((p, i) => (
                <li key={p.id} className="flex">
                  <ProjectCard
                    project={p}
                    openPaymentModal={openPaymentModal}
                    bgColor="bg-[white]"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-600 py-8 text-center">
              <p className="mb-2">No open-source projects found.</p>
              <p className="text-sm">
                Projects with status "Open" will appear here. Check the browser console for debugging information.
              </p>
            </div>
          )}
        </div>
      </SectionGrey>

      {/* COMPLETED PROJECTS */}
      <SectionGrey>
        <div ref={bountiesRef} className="flex flex-col items-center pb-8">
          <h1 className="w-full pb-8 pt-8 font-space-grotesk !text-[30px] font-semibold leading-tight tracking-tight text-black">
            Completed Projects
          </h1>
          {completedProjects.length > 0 ? (
            <ul className="grid max-w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {completedProjects.map((p) => (
                <li key={p.id} className="flex">
                  <ProjectCard
                    project={p}
                    openPaymentModal={openPaymentModal}
                    bgColor="bg-[white]"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-600 py-8 text-center">
              <p className="mb-2">No completed projects found.</p>
              <p className="text-sm">
                Projects with status "Completed", "Closed", "Bounty Completed", or "Bounty Closed" will appear here.
              </p>
            </div>
          )}
        </div>
      </SectionGrey>

      {/* OPEN BOUNTIES */}
      {openBounties.length > 0 ? (
        <SectionGrey>
          <div className="flex flex-col items-center">
            <h1 className="w-full pb-8 pt-8 font-space-grotesk !text-[30px] font-semibold leading-tight tracking-tight text-black">
              Open Bounties
            </h1>
            <ul className="grid max-w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {openBounties.map((p, i) => {
                const bgColor = bgColors[i % bgColors.length]
                return (
                  <li key={p.id} className="flex">
                    <ProjectCard
                      project={p}
                      openPaymentModal={openPaymentModal}
                      bgColor={bgColor}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        </SectionGrey>
      ) : null}

      {/* SCROLLING TEXT */}
      <SectionWhite>
        <div className="flex flex-col items-center pb-8 pt-4 text-center">
          <h1 className="font-space-grotesk text-[39px] font-[600] text-[black]">
            The Litecoin Project Development Portal
          </h1>
          <h2 className="pt-2 font-space-grotesk text-[30px] font-[600] text-[black]">
            We help advance
          </h2>
          <h3 className="font-space-grotesk text-[20px] font-semibold text-[black]">
            <TypingScroll />
          </h3>
        </div>
        <div className="m-auto flex h-full w-[1300px] max-w-[90%] flex-col-reverse justify-center lg:flex-row lg:items-center">
          <div className="flex h-4/6 min-h-fit w-full flex-col justify-center border border-[black] p-8">
            <h1 className="m-auto py-4 font-space-grotesk !text-[30px] font-[600] leading-[32px] text-[black]">
              Submit a Project
            </h1>
            <p className="m-auto max-w-3xl text-center text-lg text-[black]">
              We are looking to support talented individuals and teams who share
              our commitment to decentralized open-source solutions and the future
              of Litecoin.
            </p>
            <Link href="/projects/submit" className="m-auto pt-4">
              <Button variant="primary" className="w-48">
                Submit Project
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center pt-16">
          <h1 className="w-full pb-8 pt-8 font-space-grotesk !text-[30px] font-semibold leading-tight tracking-tight text-black">
            Project Builders
          </h1>
          <SectionContributors />
        </div>
      </SectionWhite>
    </div>
  )
}

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
function isProject(project: Project): boolean {
  // Exact match for "Open" status (case-sensitive per documentation)
  return project.status === 'Open'
}

function isOpenBounty(project: Project): boolean {
  // Exact match for "Bounty Open" status (case-sensitive per documentation)
  return project.status === 'Bounty Open'
}

function isPastProject(project: Project): boolean {
  // Exact match for completed/closed statuses (case-sensitive per documentation)
  const status = project.status || ''
  
  // Check for exact matches (trim whitespace just in case)
  const trimmedStatus = status.trim()
  const isCompleted = [
    'Bounty Closed', 
    'Bounty Completed', 
    'Closed', 
    'Completed'
  ].includes(trimmedStatus)
  
  return isCompleted
}

