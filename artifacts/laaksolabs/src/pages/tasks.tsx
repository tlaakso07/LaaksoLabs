import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TasksView } from '@/components/tasks/tasks-view'
import type { Task, Client } from '@/lib/supabase/types'

export default function TasksPage() {
  const [data, setData] = useState<{ tasks: Task[]; clients: Pick<Client, 'id' | 'name' | 'division'>[] } | null>(null)

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('tasks').select('*').order('created_at', { ascending: false }),
      sb.from('clients').select('id, name, division').order('name'),
    ]).then(([{ data: tasks }, { data: clients }]) => {
      setData({ tasks: (tasks ?? []) as Task[], clients: (clients ?? []) as Pick<Client, 'id' | 'name' | 'division'>[] })
    })
  }, [])

  if (!data) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} /></div>
  return <TasksView initialTasks={data.tasks} clients={data.clients} />
}
