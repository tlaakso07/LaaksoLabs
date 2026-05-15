import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HappyDogView, type OrderWithClient } from '@/components/happydog/happydog-view'
import type { Client } from '@/lib/supabase/types'

export default function HappyDogPage() {
  const [data, setData] = useState<{ orders: OrderWithClient[]; clients: Client[] } | null>(null)

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('happydog_orders').select('*, clients(name, division)').order('created_at', { ascending: false }),
      sb.from('clients').select('*').order('name'),
    ]).then(([{ data: orders }, { data: clients }]) => {
      setData({ orders: (orders ?? []) as OrderWithClient[], clients: (clients ?? []) as Client[] })
    })
  }, [])

  if (!data) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} /></div>
  return <HappyDogView initialOrders={data.orders} clients={data.clients} />
}
