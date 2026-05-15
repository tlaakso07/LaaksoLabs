import { createClient } from '../client'
import type { Task, TaskPriority, TaskStatus, TaskCategory } from '../types'

export async function getTasks(filters?: {
  status?: TaskStatus
  priority?: TaskPriority
  category?: TaskCategory
  client_id?: string
  due_today?: boolean
  due_this_week?: boolean
}) {
  const supabase = createClient()
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.client_id) query = query.eq('client_id', filters.client_id)

  if (filters?.due_today) {
    const today = new Date().toISOString().split('T')[0]
    query = query.lte('due_date', today).neq('status', 'done')
  }

  if (filters?.due_this_week) {
    const today = new Date()
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() + 7)
    query = query
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', weekEnd.toISOString().split('T')[0])
      .neq('status', 'done')
  }

  const { data, error } = await query
  if (error) throw error
  return data as Task[]
}

export async function createTask(payload: Omit<Task, 'id' | 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function updateTask(id: string, payload: Partial<Omit<Task, 'id' | 'created_at'>>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function completeTask(id: string) {
  return updateTask(id, {
    status: 'done',
    completed_at: new Date().toISOString(),
  })
}

export async function deleteTask(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function getOverdueTaskCount(): Promise<number> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .lt('due_date', today)
    .neq('status', 'done')
  if (error) throw error
  return count ?? 0
}

export async function getTodayTaskCount(): Promise<number> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('due_date', today)
    .neq('status', 'done')
  if (error) throw error
  return count ?? 0
}
