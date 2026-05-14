import { createAdminClient } from '@/lib/supabase/server'
import { CampaignsView } from '@/components/campaigns/campaigns-view'
import type { Campaign, Client, Division } from '@/lib/supabase/types'

export default async function CampaignsPage() {
  const supabase = createAdminClient()
  const [{ data: rawCampaigns }, { data: rawClients }] = await Promise.all([
    supabase.from('campaigns').select('*, clients(name, division)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name, division').in('status', ['active', 'onboarding']),
  ])

  type CampaignWithClient = Campaign & { clients: { name: string; division: Division } | null }
  const campaigns = (rawCampaigns ?? []) as unknown as CampaignWithClient[]
  const clients   = (rawClients   ?? []) as Pick<Client, 'id' | 'name' | 'division'>[]

  return <CampaignsView initialCampaigns={campaigns} clients={clients} />
}
