import { createAdminClient } from '@/lib/supabase/server'
import { ClientsView } from '@/components/clients/clients-view'
import type { Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  let clients: Client[] = []
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('clients').select('*').order('name')
    clients = (data ?? []) as Client[]
  } catch {}
  return <ClientsView initialClients={clients} />
}
