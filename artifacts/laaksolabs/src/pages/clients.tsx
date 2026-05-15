import { useEffect, useState } from 'react'
import { useRoute } from 'wouter'
import { createClient } from '@/lib/supabase/client'
import { ClientsView } from '@/components/clients/clients-view'
import { ClientDetail } from '@/components/clients/client-detail'
import type { Client, Task, HappyDogOrder, ActivityLog } from '@/lib/supabase/types'

type DetailState = { client: Client; initialTasks: Task[]; initialOrders: HappyDogOrder[]; initialActivity: ActivityLog[] }

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

export default function ClientsPage() {
  const [, params] = useRoute('/clients/:id')
  const clientId = params?.id
  const [clients, setClients] = useState<Client[] | null>(null)
  const [detail, setDetail] = useState<DetailState | null>(null)

  useEffect(() => {
    const sb = createClient()
    if (clientId) {
      Promise.all([
        sb.from('clients').select('*').eq('id', clientId).single(),
        sb.from('tasks').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        sb.from('happydog_orders').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        sb.from('activity_log').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      ]).then(([{ data: client }, { data: tasks }, { data: orders }, { data: activity }]) => {
        if (client) setDetail({
          client: client as Client,
          initialTasks: (tasks ?? []) as Task[],
          initialOrders: (orders ?? []) as HappyDogOrder[],
          initialActivity: (activity ?? []) as ActivityLog[],
        })
      })
    } else {
      sb.from('clients').select('*').order('name').then(({ data }) => setClients((data ?? []) as Client[]))
    }
  }, [clientId])

  if (clientId) {
    if (!detail) return <Spinner />
    return <ClientDetail {...detail} />
  }
  if (!clients) return <Spinner />
  return <ClientsView initialClients={clients} />
}
