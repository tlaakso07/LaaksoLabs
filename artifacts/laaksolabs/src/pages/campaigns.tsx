import { useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { CampaignsView } from '@/components/campaigns/campaigns-view'
import type { Client, Campaign, Division } from '@/lib/supabase/types'

type CampaignWithClient = Campaign & { clients: { name: string; division: Division } | null }

export default function CampaignsPage() {
  const [data, setData] = useState<{ campaigns: CampaignWithClient[]; clients: Pick<Client, 'id' | 'name' | 'division'>[] } | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    async function load() {
      try {
        const sb = createClient()
        const [{ data: campaigns }, { data: clients }] = await Promise.all([
          sb.from('campaigns').select('*, clients(name, division)').order('campaign_name'),
          sb.from('clients').select('id, name, division').eq('status', 'active').order('name'),
        ])
        setData({ campaigns: (campaigns ?? []) as CampaignWithClient[], clients: (clients ?? []) as Pick<Client, 'id' | 'name' | 'division'>[] })
      } catch (err) {
        console.error('[campaigns] load failed:', err)
      }
    }
    load()
  }, [])

  if (!data) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} /></div>
  return <CampaignsView initialCampaigns={data.campaigns} clients={data.clients} />
}
