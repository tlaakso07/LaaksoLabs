import { createAdminClient } from '@/lib/supabase/server'
import { TasksView } from '@/components/tasks/tasks-view'
import type { Task, Client } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const db = createAdminClient()
  const [tasksRes, clientsRes] = await Promise.all([
    db
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false }),
    db.from('clients').select('id, name, division').order('name'),
  ])

  return (
    <TasksView
      initialTasks={(tasksRes.data ?? []) as Task[]}
      clients={(clientsRes.data ?? []) as Pick<Client, 'id' | 'name' | 'division'>[]}
    />
  )
}
