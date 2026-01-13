import { NextResponse } from 'next/server'
import { getAllActiveContributors } from '@/services/cms/contributors'

export async function GET() {
  try {
    const contributors = await getAllActiveContributors()
    
    // Return full contributor data for ContributorCard component
    return NextResponse.json(contributors)
  } catch (error) {
    console.error('Error fetching contributors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contributors' },
      { status: 500 }
    )
  }
}

