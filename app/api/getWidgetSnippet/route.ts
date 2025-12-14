import { NextResponse } from 'next/server'
import axios from 'axios'
import { getAccessToken } from '@/services/tgb/auth'

export async function GET() {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      console.error('[getWidgetSnippet] Access token is missing.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Litecoin Foundation org + DAF widget snippet (ported from the legacy project)
    const organizationId = '1189134331'
    const apiUrl = `https://public-api.tgbwidget.com/v1/organization/${organizationId}/widget-snippet`

    const requestBody = {
      uiVersion: 2,
      donationFlow: ['daf'],
      button: {
        id: 'tgb-widget-button',
        text: 'DAF',
        style: `
          width: 100%;
          height: 100%;
          font-family: "Space Grotesk", "Noto Sans", "Roboto", "Helvetica", "Arial", sans-serif;
          color: #222222;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s;
          transform: translateY(0px);
          cursor: pointer;
        `,
      },
      scriptId: 'tgb-widget-script',
      campaignId: 'LitecoinWebsiteDAF',
    }

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    // Legacy response shape is { data: { ... } }, and PaymentForm expects `popup`
    const data = response.data?.data
    if (!data?.popup) {
      console.error('[getWidgetSnippet] Unexpected response structure:', response.data)
      return NextResponse.json(
        { error: 'Unexpected response structure' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        '[getWidgetSnippet] Axios error:',
        error.response?.data || error.message
      )
      return NextResponse.json(
        {
          error:
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Internal Server Error',
        },
        { status: error.response?.status || 500 }
      )
    }

    console.error('[getWidgetSnippet] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}


