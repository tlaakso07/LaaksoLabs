import { createAdminClient } from '@/lib/supabase/server'
import { RevenueView, type EntryWithClient } from '@/components/revenue/revenue-view'
import type { Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
  let entries: EntryWithClient[] = []
  let clients: Client[] = []

  try {
    const supabase = createAdminClient()
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 11)
    const cutoffStr = cutoff.toISOString().split('T')[0].slice(0, 7) + '-01'

    const [entriesRes, clientsRes] = await Promise.all([
      supabase
        .from('revenue_entries')
        .select('*, clients(name, division)')
        .gte('month', cutoffStr)
        .order('month', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
    ])
    entries = (entriesRes.data ?? []) as unknown as EntryWithClient[]
    clients = (clientsRes.data ?? []) as Client[]
  } catch {}

  return <RevenueView initialEntries={entries} clients={clients} />
}
