import { NextRequest, NextResponse } from 'next/server'
import { getProjectBySlug } from '@/services/webflow/projects'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Next.js 15+ params are always a Promise
    const resolvedParams = await params
    const slug = resolvedParams.slug
    
    const project = await getProjectBySlug(slug)

    if (!project) {
      console.error(`[API Route] Project "${slug}" not found`)
      return NextResponse.json(
        { error: 'Project not found', slug },
        { status: 404 }
      )
    }

    return NextResponse.json({ project })
  } catch (error: any) {
    console.error('[API Route] Error fetching project:', error)
    console.error('[API Route] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to fetch project', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

