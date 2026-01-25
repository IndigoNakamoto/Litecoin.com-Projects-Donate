import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'
import { getAllPublishedProjects } from '@/services/cms/projects'
import { Project } from '@/types/project'

export const runtime = 'nodejs'

interface Stats {
  projectsSupported: number
  totalPaid: number
  donationsRaised: number
  donationsMatched: number | null
}

export async function GET(request: NextRequest) {
  // Bump cache key to avoid serving previously cached incorrect values
  const cacheKey = 'stats:all:v6'
  const debug =
    process.env.NODE_ENV !== 'production' &&
    request.nextUrl.searchParams.get('debug') === '1'

  try {
    // Try to fetch the cached stats
    try {
      const cachedStats = await kv.get<Stats>(cacheKey)
      if (cachedStats && !debug) {
        return NextResponse.json(cachedStats, {
          headers: {
            'Cache-Control': 's-maxage=600, stale-while-revalidate',
          },
        })
      }
    } catch {
      // KV not available, continue
    }

    // If not cached, fetch the data
    const projects = await getAllPublishedProjects()

    // Calculate total paid from projects
    const totalPaid = projects.reduce((acc: number, project: Project) => {
      const paid = project.totalPaid || 0
      return acc + (typeof paid === 'number' ? paid : 0)
    }, 0)

    // Calculate projects supported - use project count (original behavior)
    // If you want to count only projects with donations, uncomment the try-catch below
    const projectsSupported = projects.length

    // Calculate donations raised and matched
    // Try API first, fallback to direct database if API unavailable
    let donationsRaised = 0
    let donationsMatched: number | null = null

    const debugInfo: Record<string, unknown> | undefined = debug
      ? {
          version: 'stats-debug-v6-api',
          used: null,
          tables: null,
          donationPledge: null,
          legacyDonations: null,
          legacyMatching: null,
          errors: [],
        }
      : undefined

    // Try to fetch from database API first
    const apiUrl = process.env.DATABASE_API_URL || 'https://projectsapi.lite.space'
    try {
      console.log('[stats] Fetching from database API:', apiUrl)
      const apiResponse = await fetch(`${apiUrl}/api/stats`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })
      
      if (apiResponse.ok) {
        const apiStats = await apiResponse.json()
        donationsRaised = apiStats.donationsRaised || 0
        donationsMatched = apiStats.donationsMatched ?? null
        console.log('[stats] API response:', { donationsRaised, donationsMatched })
        if (debugInfo) debugInfo.used = 'database-api'
      } else {
        throw new Error(`API returned ${apiResponse.status}`)
      }
    } catch (apiError) {
      console.warn('[stats] Database API failed, falling back to direct database:', apiError)
      if (debugInfo) {
        ;(debugInfo.errors as unknown[]).push({
          where: 'database-api',
          message: apiError instanceof Error ? apiError.message : String(apiError),
        })
      }
      
      // Fallback to direct database connection
      try {
        const { prisma } = await import('@/lib/prisma')
      
      // Test database connection first
      try {
        const testResult = await prisma.$queryRaw<{ test: number }[]>`SELECT 1 as test`
        console.log('[stats] Database connection test:', testResult)
      } catch (dbError) {
        console.error('[stats] Database connection failed:', dbError)
        if (debugInfo) {
          ;(debugInfo.errors as unknown[]).push({
            where: 'database-connection-test',
            message: dbError instanceof Error ? dbError.message : String(dbError),
          })
        }
        // If connection fails, return early with defaults
        throw dbError
      }

      if (debugInfo) {
        try {
          const conn = await prisma.$queryRaw<
            { current_database: string; current_schema: string; current_user: string }[]
          >`
            SELECT
              current_database() AS current_database,
              current_schema() AS current_schema,
              current_user AS current_user
          `
          debugInfo.connection = conn?.[0] ?? null
          debugInfo.shadowDb =
            (conn?.[0]?.current_database || '').startsWith('prisma_migrate_shadow_db_') ||
            (conn?.[0]?.current_database || '').includes('shadow_db')

          const tables = await prisma.$queryRaw<{ table_name: string }[]>`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
          `
          debugInfo.tables = tables.map((t: { table_name: string }) => t.table_name)
        } catch (e) {
          ;(debugInfo.errors as unknown[]).push({
            where: 'information_schema.tables',
            message: e instanceof Error ? e.message : String(e),
          })
        }
      }

      // Prefer legacy tables if they still exist (keeps parity with the old project),
      // otherwise fall back to the new `DonationPledge` model.
      try {
        if (debugInfo) {
          try {
            const donationColumns = await prisma.$queryRaw<
              { column_name: string; data_type: string; is_nullable: string }[]
            >`
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'donations'
              ORDER BY ordinal_position
            `

            const donationCounts = await prisma.$queryRaw<
              {
                total: number
                processed_true: number
                success_true: number
                vat_usd_not_null: number
              }[]
            >`
              SELECT
                COUNT(*)::int AS total,
                SUM(CASE WHEN processed = true THEN 1 ELSE 0 END)::int AS processed_true,
                SUM(CASE WHEN success = true THEN 1 ELSE 0 END)::int AS success_true,
                SUM(CASE WHEN value_at_donation_time_usd IS NOT NULL THEN 1 ELSE 0 END)::int AS vat_usd_not_null
              FROM donations
            `

            const processedBreakdown = await prisma.$queryRaw<
              { processed: boolean | null; count: number }[]
            >`
              SELECT processed, COUNT(*)::int AS count
              FROM donations
              GROUP BY processed
              ORDER BY processed
            `

            const statusBreakdown = await prisma.$queryRaw<
              { status: string | null; count: number }[]
            >`
              SELECT status, COUNT(*)::int AS count
              FROM donations
              GROUP BY status
              ORDER BY count DESC
              LIMIT 20
            `

            const sample = await prisma.$queryRaw<
              {
                id: number | string | null
                processed: boolean | null
                status: string | null
                donation_type: string | null
                pledge_id: string | null
                value_at_donation_time_usd: number | null
              }[]
            >`
              SELECT
                id,
                processed,
                status,
                donation_type::text as donation_type,
                pledge_id,
                value_at_donation_time_usd
              FROM donations
              ORDER BY id DESC
              LIMIT 5
            `

            const rls = await prisma.$queryRaw<
              { relrowsecurity: boolean; relforcerowsecurity: boolean }[]
            >`
              SELECT c.relrowsecurity, c.relforcerowsecurity
              FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'public' AND c.relname = 'donations'
              LIMIT 1
            `

            const policies = await prisma.$queryRaw<
              {
                policyname: string
                permissive: string
                roles: string[]
                cmd: string
                qual: string | null
                with_check: string | null
              }[]
            >`
              SELECT
                policyname,
                permissive::text as permissive,
                roles::text[] as roles,
                cmd::text as cmd,
                qual,
                with_check
              FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'donations'
              ORDER BY policyname
            `

            debugInfo.legacyDonations = {
              ...(typeof debugInfo.legacyDonations === 'object' && debugInfo.legacyDonations
                ? (debugInfo.legacyDonations as object)
                : {}),
              columns: donationColumns,
              counts: donationCounts?.[0] ?? null,
              rls: rls?.[0] ?? null,
              policies,
              processedBreakdown,
              statusBreakdown,
              sample,
            }
          } catch (e) {
            ;(debugInfo.errors as unknown[]).push({
              where: 'debug:donations-introspection',
              message: e instanceof Error ? e.message : String(e),
            })
          }
        }

        console.log('[stats] Executing donations query...')
        const rows = await prisma.$queryRaw<
          {
            sum_success: number | null
            sum_processed: number | null
            sum_complete: number | null
            sum_any: number | null
          }[]
        >`
          SELECT
            SUM(
              CASE WHEN success = true THEN
                COALESCE(
                  value_at_donation_time_usd,
                  "pledgeAmount",
                  amount,
                  gross_amount,
                  net_value_amount,
                  payout_amount,
                  0
                )
              ELSE 0 END
            )::float AS sum_success,
            SUM(
              CASE WHEN processed = true THEN
                COALESCE(
                  value_at_donation_time_usd,
                  "pledgeAmount",
                  amount,
                  gross_amount,
                  net_value_amount,
                  payout_amount,
                  0
                )
              ELSE 0 END
            )::float AS sum_processed,
            SUM(
              CASE WHEN status IN ('Complete', 'Advanced') THEN
                COALESCE(
                  value_at_donation_time_usd,
                  "pledgeAmount",
                  amount,
                  gross_amount,
                  net_value_amount,
                  payout_amount,
                  0
                )
              ELSE 0 END
            )::float AS sum_complete,
            SUM(
              COALESCE(
                value_at_donation_time_usd,
                "pledgeAmount",
                amount,
                gross_amount,
                net_value_amount,
                payout_amount,
                0
              )
            )::float AS sum_any
          FROM donations
        `

        const sumSuccess = rows?.[0]?.sum_success ?? 0
        const sumProcessed = rows?.[0]?.sum_processed ?? 0
        const sumComplete = rows?.[0]?.sum_complete ?? 0
        const sumAny = rows?.[0]?.sum_any ?? 0

        if (debugInfo) {
          const prev =
            typeof debugInfo.legacyDonations === 'object' && debugInfo.legacyDonations
              ? (debugInfo.legacyDonations as Record<string, unknown>)
              : {}
          debugInfo.legacyDonations = {
            ...prev,
            sumSuccess,
            sumProcessed,
            sumComplete,
            sumAny,
          }
        }

        // Choose the best available sum
        // (success is often the most reliable across donation types)
        if (sumSuccess > 0) {
          donationsRaised = sumSuccess
          if (debugInfo) debugInfo.used = 'legacy:donations(success)'
        } else if (sumProcessed > 0) {
          donationsRaised = sumProcessed
          if (debugInfo) debugInfo.used = 'legacy:donations(processed)'
        } else if (sumComplete > 0) {
          donationsRaised = sumComplete
          if (debugInfo) debugInfo.used = 'legacy:donations(complete)'
        } else if (sumAny > 0) {
          donationsRaised = sumAny
          if (debugInfo) debugInfo.used = 'legacy:donations(any)'
        }
      } catch (error) {
        // Table doesn't exist (or column differs) in the new schema — ignore.
        console.error('[stats] Error querying donations table:', error)
      }

      if (donationsRaised === 0) {
        try {
          const raised = await prisma.donationPledge.aggregate({
            _sum: { pledgeAmount: true },
            where: {
              // The UI formats USD; without an exchange-rate table we can only
              // safely sum USD-denominated pledges here. We also include fiat
              // pledges defensively in case the currency casing/format varies.
              OR: [
                { pledgeCurrency: { equals: 'USD', mode: 'insensitive' } },
                { donationType: 'fiat' },
              ],
              // If pledgeId is present, it generally indicates a processed pledge
              // (fiat). Leaving it optional keeps behavior permissive.
            },
          })
          donationsRaised = raised._sum.pledgeAmount ?? 0
          if (debugInfo) {
            debugInfo.donationPledge = { sum: donationsRaised }
            debugInfo.used = 'prisma:donationPledge'
          }
        } catch (e: any) {
          // Old live DB may not have DonationPledge; ignore.
          if (debugInfo) {
            ;(debugInfo.errors as unknown[]).push({
              where: 'prisma:donationPledge.aggregate',
              message: e instanceof Error ? e.message : String(e),
            })
          }
        }
      }

      // Matching donations: try legacy table if present. (New schema doesn’t
      // currently model matching logs.)
      try {
        if (debugInfo) {
          try {
            const matchingColumns = await prisma.$queryRaw<
              { column_name: string; data_type: string; is_nullable: string }[]
            >`
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'MatchingDonationLog'
              ORDER BY ordinal_position
            `

            const matchingCount = await prisma.$queryRaw<{ total: number }[]>`
              SELECT COUNT(*)::int AS total
              FROM "MatchingDonationLog"
            `

            const sample = await prisma.$queryRaw<Record<string, unknown>[]>`
              SELECT *
              FROM "MatchingDonationLog"
              ORDER BY 1 DESC
              LIMIT 3
            `

            debugInfo.legacyMatching = {
              columns: matchingColumns,
              counts: matchingCount?.[0] ?? null,
              sample,
            }
          } catch (e) {
            ;(debugInfo.errors as unknown[]).push({
              where: 'debug:MatchingDonationLog-introspection',
              message: e instanceof Error ? e.message : String(e),
            })
          }
        }

        // Your DB uses camelCase columns ("matchedAmount") as shown in debug output.
        // Note: Column name must be quoted because it's camelCase
        console.log('[stats] Executing matching donations query...')
        const matchedRows = await prisma.$queryRaw<{ total: number | null }[]>`
          SELECT SUM("matchedAmount")::float AS total
          FROM "MatchingDonationLog"
        `
        console.log('[stats] Matching query raw result:', matchedRows)
        donationsMatched = matchedRows?.[0]?.total ?? null
        // Convert null to 0 if needed, but keep null to distinguish from "no data"
        if (donationsMatched === null) {
          donationsMatched = 0
        }
        
        // Log the matched amount for debugging
        console.log('[stats] Matching donations query result:', {
          rawTotal: matchedRows?.[0]?.total,
          donationsMatched,
        })

        if (debugInfo) {
          const prev =
            typeof debugInfo.legacyMatching === 'object' && debugInfo.legacyMatching
              ? (debugInfo.legacyMatching as Record<string, unknown>)
              : {}
          debugInfo.legacyMatching = { ...prev, sum: donationsMatched }
        }
      } catch (error) {
        console.error('[stats] Error querying MatchingDonationLog:', error)
        if (debugInfo) {
          ;(debugInfo.errors as unknown[]).push({
            where: 'legacy:MatchingDonationLog-query',
            message: error instanceof Error ? error.message : String(error),
          })
        }
        donationsMatched = null
      }
    } catch {
      // Prisma not configured / database unavailable: keep defaults.
      donationsRaised = 0
      donationsMatched = null
    }

    const stats: Stats = {
      projectsSupported,
      totalPaid,
      donationsRaised,
      donationsMatched,
    }
    
    // Log final stats for debugging
    console.log('[stats] Final stats:', {
      projectsSupported,
      totalPaid,
      donationsRaised,
      donationsMatched,
    })

    // Cache the stats for 10 minutes
    try {
      await kv.set(cacheKey, stats, { ex: 600 })
    } catch {
      // KV not available, continue
    }

    if (debugInfo) {
      return NextResponse.json({ ...stats, _debug: debugInfo }, { status: 200 })
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate',
      },
    })
  } catch (error: unknown) {
    console.error('[stats] Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

