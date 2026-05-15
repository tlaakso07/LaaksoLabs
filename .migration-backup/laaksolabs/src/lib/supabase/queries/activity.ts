import { createClient } from '../client'
import type { ActivityLog, ActivityType } from '../types'

export async function getActivityLog(filters?: {
  client_id?: string
  type?: ActivityType
  limit?: number
}) {
  const supabase = createClient()
  let query = supabase
    .from('activity_log')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 50)

  if (filters?.client_id) query = query.eq('client_id', filters.client_id)
  if (filters?.type) query = query.eq('type', filters.type)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function logActivity(payload: Omit<ActivityLog, 'id' | 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activity_log')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data as ActivityLog
}
