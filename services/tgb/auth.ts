import axios from 'axios'
import { addSeconds, isBefore } from 'date-fns'
import { prisma } from '@/lib/prisma'

interface TokenRecord {
  id: number
  accessToken: string
  refreshToken: string
  expiresAt: Date
  refreshedAt: Date
}

const TGB_API_BASE = 'https://public-api.tgbwidget.com/v1'

export async function getAccessToken(): Promise<string> {
  try {
    // Fetch the latest token from the database
    const token = await prisma?.token.findFirst({
      orderBy: { refreshedAt: 'desc' },
    })

    if (token) {
      const now = new Date()

      if (isBefore(now, token.expiresAt)) {
        // Access token is still valid
        return token.accessToken
      } else {
        // Access token has expired, attempt to refresh
        return await refreshAccessToken(token.refreshToken)
      }
    } else {
      // No token exists, perform login to obtain tokens
      return await loginAndSaveTokens()
    }
  } catch (error: any) {
    // Check if it's a database connection error or table doesn't exist
    if (
      error?.code === 'P1001' || 
      error?.code === 'P2021' || // Table does not exist
      error?.code === 'ETIMEDOUT' || // Connection timeout
      error?.message?.includes('Environment variable not found') || 
      error?.message?.includes('Can\'t reach database server') ||
      error?.message?.includes('does not exist in the current database') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ETIMEDOUT')
    ) {
      console.warn('Database unavailable or table missing, attempting login without token cache:', error.message)
      // If database is unavailable or table doesn't exist, try to login directly
      try {
        return await loginAndSaveTokens()
      } catch (loginError: any) {
        console.error('Error in getAccessToken (login fallback):', loginError)
        throw new Error(`Unable to obtain access token: ${loginError.message || 'Login failed'}`)
      }
    }
    console.error('Error in getAccessToken:', error)
    throw new Error(`Unable to obtain access token: ${error.message || 'Unknown error'}`)
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    const response = await axios.post(`${TGB_API_BASE}/refresh-tokens`, {
      refreshToken,
    })

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      response.data.data

    const expiresAt = addSeconds(new Date(), 2 * 60 * 60) // Token valid for 2 hours

    // Upsert the new tokens into the database (only if database is available)
    if (prisma) {
      try {
        await prisma.token.upsert({
          where: { id: 1 },
          update: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt: expiresAt,
            refreshedAt: new Date(),
          },
          create: {
            id: 1,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt: expiresAt,
            refreshedAt: new Date(),
          },
        })
      } catch (dbError: any) {
        // If database is unavailable or table doesn't exist, log warning but continue
        if (
          dbError?.code === 'P1001' || 
          dbError?.code === 'P2021' || // Table does not exist
          dbError?.code === 'ETIMEDOUT' || // Connection timeout
          dbError?.message?.includes('Environment variable not found') || 
          dbError?.message?.includes('Can\'t reach database server') ||
          dbError?.message?.includes('does not exist in the current database') ||
          dbError?.message?.includes('timeout') ||
          dbError?.message?.includes('ETIMEDOUT')
        ) {
          console.warn('Database unavailable or table missing, skipping token cache update')
        } else {
          throw dbError
        }
      }
    }

    return newAccessToken
  } catch (error: any) {
    console.error(
      'Error refreshing access token:',
      error.response?.data || error.message
    )
    // If refreshing fails, attempt to login again
    return await loginAndSaveTokens()
  }
}

async function loginAndSaveTokens(): Promise<string> {
  try {
    const login = process.env.GIVING_BLOCK_LOGIN
    const password = process.env.GIVING_BLOCK_PASSWORD

    if (!login || !password) {
      throw new Error('GIVING_BLOCK_LOGIN and GIVING_BLOCK_PASSWORD environment variables must be set')
    }

    const response = await axios.post(`${TGB_API_BASE}/login`, {
      login,
      password,
    })

    if (!response.data?.data?.accessToken) {
      console.error('[TGB Auth] Unexpected response structure:', response.data)
      throw new Error('Invalid response from TGB API: missing accessToken')
    }

    const { accessToken, refreshToken } = response.data.data

    const expiresAt = addSeconds(new Date(), 2 * 60 * 60) // Token valid for 2 hours

    // Upsert the tokens into the database (only if database is available)
    if (prisma) {
      try {
        await prisma.token.upsert({
          where: { id: 1 },
          update: {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: expiresAt,
            refreshedAt: new Date(),
          },
          create: {
            id: 1,
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: expiresAt,
            refreshedAt: new Date(),
          },
        })
      } catch (dbError: any) {
        // If database is unavailable or table doesn't exist, log warning but continue
        if (
          dbError?.code === 'P1001' || 
          dbError?.code === 'P2021' || // Table does not exist
          dbError?.code === 'ETIMEDOUT' || // Connection timeout
          dbError?.message?.includes('Environment variable not found') || 
          dbError?.message?.includes('Can\'t reach database server') ||
          dbError?.message?.includes('does not exist in the current database') ||
          dbError?.message?.includes('timeout') ||
          dbError?.message?.includes('ETIMEDOUT')
        ) {
          console.warn('Database unavailable or table missing, skipping token cache update')
        } else {
          throw dbError
        }
      }
    }

    return accessToken
  } catch (error: any) {
    // Enhanced error logging
    console.error('[TGB Auth] Error logging in to get new tokens:')
    console.error('  - Status:', error.response?.status)
    console.error('  - Status Text:', error.response?.statusText)
    console.error('  - Response Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('  - Error Message:', error.message)
    console.error('  - Error Code:', error.code)
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid Giving Block credentials - please check GIVING_BLOCK_LOGIN and GIVING_BLOCK_PASSWORD')
    } else if (error.response?.status === 400) {
      throw new Error(`TGB API validation error: ${JSON.stringify(error.response?.data)}`)
    } else if (error.response?.status) {
      throw new Error(`TGB API error (${error.response.status}): ${error.response?.data?.message || error.response?.data?.error || error.message}`)
    } else if (error.message?.includes('GIVING_BLOCK')) {
      throw error // Re-throw the environment variable error as-is
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Network error connecting to TGB API: ${error.message}`)
    } else {
      throw new Error(`Unable to obtain access token: ${error.message || 'Unknown error'}`)
    }
  }
}

