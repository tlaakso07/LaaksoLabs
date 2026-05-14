import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { ClientDetail } from '@/components/clients/client-detail'
import type { Client, Task, HappyDogOrder, ActivityLog } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [clientRes, tasksRes, ordersRes, activityRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('tasks').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('happydog_orders').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('activity_log').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(30),
  ])

  if (clientRes.error || !clientRes.data) notFound()

  return (
    <ClientDetail
      client={clientRes.data as Client}
      initialTasks={(tasksRes.data ?? []) as Task[]}
      initialOrders={(ordersRes.data ?? []) as HappyDogOrder[]}
      initialActivity={(activityRes.data ?? []) as ActivityLog[]}
    />
  )
}
