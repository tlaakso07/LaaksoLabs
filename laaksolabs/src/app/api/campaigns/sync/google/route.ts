import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

export const dynamic = 'force-dynamic'

interface GoogleSearchRow {
  campaign?: { id: string; name: string; status: string }
  campaignBudget?: { amountMicros: string }
  metrics?: { costMicros: string; conversions: string; ctr: string }
}

interface GoogleSearchResponse {
  results?: GoogleSearchRow[]
  error?: { message: string; status: string }
}

interface OAuthTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

type CampaignStatus = 'active' | 'paused' | 'draft' | 'completed'

function mapGoogleStatus(status: string): CampaignStatus {
  switch (status) {
    case 'ENABLED':
      return 'active'
    case 'PAUSED':
      return 'paused'
    default:
      return 'paused'
  }
}

export async function POST() {
  const auth = await requireAuth()
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN

  if (!developerToken || !customerId || !clientId || !clientSecret || !refreshToken) {
    return NextResponse.json(
      { error: 'Google Ads credentials are not fully configured' },
      { status: 400 },
    )
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = (await tokenRes.json()) as OAuthTokenResponse
    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          error: `Google OAuth failed: ${tokenData.error_description ?? tokenData.error ?? 'no access token returned'}`,
        },
        { status: 400 },
      )
    }

    const cleanId = customerId.replace(/-/g, '')
    const searchRes = await fetch(
      `https://googleads.googleapis.com/v17/customers/${cleanId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenData.access_token}`,
          'developer-token': developerToken,
        },
        body: JSON.stringify({
          query: `
            SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              campaign_budget.amount_micros,
              metrics.cost_micros,
              metrics.conversions,
              metrics.ctr
            FROM campaign
            WHERE segments.date DURING THIS_MONTH
              AND campaign.status != 'REMOVED'
          `,
        }),
      },
    )

    const searchData = (await searchRes.json()) as GoogleSearchResponse
    if (searchData.error) {
      return NextResponse.json({ error: `Google Ads API: ${searchData.error.message}` }, { status: 400 })
    }

    const now = new Date().toISOString()
    const campaigns = (searchData.results ?? []).map((row) => {
      const spendMtd = row.metrics?.costMicros
        ? Math.round(Number(row.metrics.costMicros) / 1_000_000)
        : null
      const leadsMtd = row.metrics?.conversions ? Math.round(Number(row.metrics.conversions)) : null
      const costPerLead =
        spendMtd != null && leadsMtd != null && leadsMtd > 0
          ? Math.round((spendMtd / leadsMtd) * 100) / 100
          : null

      return {
        platform_id: row.campaign?.id ?? '',
        platform: 'google' as const,
        campaign_name: row.campaign?.name ?? 'Unknown',
        status: mapGoogleStatus(row.campaign?.status ?? ''),
        daily_budget: row.campaignBudget?.amountMicros
          ? Math.round(Number(row.campaignBudget.amountMicros) / 1_000_000)
          : null,
        spend_mtd: spendMtd,
        leads_mtd: leadsMtd,
        cost_per_lead: costPerLead,
        ctr: row.metrics?.ctr ? Number(row.metrics.ctr) : null,
        last_synced: now,
      }
    })

    return NextResponse.json({ campaigns, synced_at: now })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Google sync failed: ${msg}` }, { status: 500 })
  }
}
