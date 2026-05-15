import { createAdminClient } from '@/lib/supabase/server'
import { HappyDogView, type OrderWithClient } from '@/components/happydog/happydog-view'
import type { Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function HappyDogPage() {
  let orders: OrderWithClient[] = []
  let clients: Client[] = []

  try {
    const supabase = createAdminClient()
    const [ordersRes, clientsRes] = await Promise.all([
      supabase
        .from('happydog_orders')
        .select('*, clients(name, division)')
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
    ])
    orders = (ordersRes.data ?? []) as unknown as OrderWithClient[]
    clients = (clientsRes.data ?? []) as Client[]
  } catch {}

  return <HappyDogView initialOrders={orders} clients={clients} />
}
