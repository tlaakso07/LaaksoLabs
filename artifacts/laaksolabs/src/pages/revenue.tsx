import { useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { RevenueView, type EntryWithClient } from '@/components/revenue/revenue-view'
import type { Client } from '@/lib/supabase/types'

export default function RevenuePage() {
  const [data, setData] = useState<{ entries: EntryWithClient[]; clients: Client[] } | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    async function load() {
      try {
        const sb = createClient()
        const [{ data: entries }, { data: clients }] = await Promise.all([
          sb.from('revenue_entries').select('*, clients(name, division)').order('month', { ascending: false }),
          sb.from('clients').select('*').order('name'),
        ])
        setData({ entries: (entries ?? []) as EntryWithClient[], clients: (clients ?? []) as Client[] })
      } catch (err) {
        console.error('[revenue] load failed:', err)
      }
    }
    load()
  }, [])

  if (!data) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} /></div>
  return <RevenueView initialEntries={data.entries} clients={data.clients} />
}
