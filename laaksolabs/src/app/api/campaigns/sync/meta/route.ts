import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

export const dynamic = 'force-dynamic'

interface MetaCampaign {
  id: string
  name: string
  status: string
  effective_status?: string
  daily_budget?: string
}

interface MetaInsight {
  campaign_id: string
  spend?: string
  ctr?: string
  actions?: Array<{ action_type: string; value: string }>
  cost_per_action_type?: Array<{ action_type: string; value: string }>
}

interface MetaApiResponse<T> {
  data?: T[]
  error?: { message: string; type: string; code: number }
}

export interface NormalizedCampaign {
  platform_id: string
  platform: 'meta' | 'google'
  campaign_name: string
  status: 'active' | 'paused' | 'draft' | 'completed'
  daily_budget: number | null
  spend_mtd: number | null
  leads_mtd: number | null
  cost_per_lead: number | null
  ctr: number | null
  last_synced: string
}

function mapMetaStatus(status: string): NormalizedCampaign['status'] {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'active'
    case 'PAUSED':
      return 'paused'
    case 'ARCHIVED':
    case 'DELETED':
    case 'COMPLETED':
      return 'completed'
    default:
      return 'paused'
  }
}

export async function POST() {
  const auth = await requireAuth()
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const token = process.env.META_ACCESS_TOKEN
  const rawAccountId = process.env.META_AD_ACCOUNT_ID
  if (!token || !rawAccountId) {
    return NextResponse.json(
      { error: 'META_ACCESS_TOKEN and META_AD_ACCOUNT_ID are not configured' },
      { status: 400 },
    )
  }

  const accountId = rawAccountId.replace(/^act_/, '')

  try {
    const campaignsUrl = new URL(`https://graph.facebook.com/v20.0/act_${accountId}/campaigns`)
    campaignsUrl.searchParams.set('fields', 'id,name,status,effective_status,daily_budget')
    campaignsUrl.searchParams.set('access_token', token)
    campaignsUrl.searchParams.set('limit', '200')

    const campaignsRes = await fetch(campaignsUrl.toString())
    const campaignsData = (await campaignsRes.json()) as MetaApiResponse<MetaCampaign>

    if (campaignsData.error) {
      return NextResponse.json({ error: `Meta API: ${campaignsData.error.message}` }, { status: 400 })
    }

    const insightsUrl = new URL(`https://graph.facebook.com/v20.0/act_${accountId}/insights`)
    insightsUrl.searchParams.set('fields', 'campaign_id,spend,ctr,actions,cost_per_action_type')
    insightsUrl.searchParams.set('date_preset', 'this_month')
    insightsUrl.searchParams.set('level', 'campaign')
    insightsUrl.searchParams.set('access_token', token)
    insightsUrl.searchParams.set('limit', '200')

    const insightsRes = await fetch(insightsUrl.toString())
    const insightsData = (await insightsRes.json()) as MetaApiResponse<MetaInsight>

    const insightMap = new Map<string, MetaInsight>()
    for (const row of insightsData.data ?? []) insightMap.set(row.campaign_id, row)

    const now = new Date().toISOString()
    const campaigns: NormalizedCampaign[] = (campaignsData.data ?? []).map((c) => {
      const insight = insightMap.get(c.id)
      const leadAction = insight?.actions?.find(
        (a) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped',
      )
      const cplAction = insight?.cost_per_action_type?.find(
        (a) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped',
      )

      const spendMtd = insight?.spend ? Number(insight.spend) : null
      const leadsMtd = leadAction ? Number(leadAction.value) : null
      const costPerLead = cplAction
        ? Number(cplAction.value)
        : spendMtd != null && leadsMtd != null && leadsMtd > 0
          ? Math.round((spendMtd / leadsMtd) * 100) / 100
          : null

      return {
        platform_id: c.id,
        platform: 'meta',
        campaign_name: c.name,
        status: mapMetaStatus(c.effective_status ?? c.status),
        daily_budget: c.daily_budget ? Math.round(Number(c.daily_budget) / 100) : null,
        spend_mtd: spendMtd,
        leads_mtd: leadsMtd != null ? Math.round(leadsMtd) : null,
        cost_per_lead: costPerLead,
        ctr: insight?.ctr ? Number(insight.ctr) / 100 : null,
        last_synced: now,
      }
    })

    return NextResponse.json({ campaigns, synced_at: now })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Meta sync failed: ${msg}` }, { status: 500 })
  }
}
