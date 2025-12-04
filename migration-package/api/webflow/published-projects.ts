// /pages/api/webflow/published-projects.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAllPublishedProjectsFull } from '../../../utils/webflow'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    // Fetch all published projects from Webflow (bypassing cache)
    // This already filters out drafts and archived projects
    const publishedProjects = await getAllPublishedProjectsFull()

    // Format the response with relevant details
    const formattedProjects = publishedProjects.map((project) => ({
      id: project.id,
      name: project.fieldData.name,
      slug: project.fieldData.slug,
      summary: project.fieldData.summary,
      status: project.fieldData.status,
      projectType: project.fieldData['project-type'],
      hidden: project.fieldData.hidden,
      recurring: project.fieldData.recurring,
      totalPaid: project.fieldData['total-paid'],
      serviceFeesCollected: project.fieldData['service-fees-collected'],
      lastPublished: project.lastPublished,
      lastUpdated: project.lastUpdated,
      createdOn: project.createdOn,
      coverImage: (project.fieldData as any)['cover-image']?.url || null,
      website: project.fieldData['website-link'],
      github: project.fieldData['github-link'],
      twitter: (project.fieldData as any)['twitter-link'] || null,
      discord: project.fieldData['discord-link'],
      telegram: project.fieldData['telegram-link'],
      reddit: project.fieldData['reddit-link'],
      facebook: project.fieldData['facebook-link'],
    }))

    // Sort by name for easier browsing
    formattedProjects.sort((a, b) => a.name.localeCompare(b.name))

    return res.status(200).json({
      total: formattedProjects.length,
      projects: formattedProjects,
    })
  } catch (error) {
    console.error('Error fetching published projects:', error)
    return res.status(500).json({
      error: 'Failed to fetch published projects',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

