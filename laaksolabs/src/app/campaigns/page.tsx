import { createAdminClient } from '@/lib/supabase/server'
import { CampaignsView } from '@/components/campaigns/campaigns-view'
import type { Campaign, Client, Division } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function getConnections() {
  const metaConnected = !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID)
  const googleConnected = !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN
  )
  return {
    meta: {
      connected: metaConnected,
      hint: metaConnected ? null : 'Set META_ACCESS_TOKEN, META_AD_ACCOUNT_ID',
    },
    google: {
      connected: googleConnected,
      hint: googleConnected
        ? null
        : 'Set GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN',
    },
  }
}

export default async function CampaignsPage() {
  const supabase = createAdminClient()
  const [{ data: rawCampaigns }, { data: rawClients }] = await Promise.all([
    supabase.from('campaigns').select('*, clients(name, division)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name, division').in('status', ['active', 'onboarding']),
  ])

  type CampaignWithClient = Campaign & { clients: { name: string; division: Division } | null }
  const campaigns = (rawCampaigns ?? []) as unknown as CampaignWithClient[]
  const clients   = (rawClients   ?? []) as Pick<Client, 'id' | 'name' | 'division'>[]

  return <CampaignsView initialCampaigns={campaigns} clients={clients} initialConnections={getConnections()} />
}
