import { createClient } from '../client'
import type { HappyDogOrder, HappyDogStatus } from '../types'

export async function getHappyDogOrders(filters?: { client_id?: string; status?: HappyDogStatus }) {
  const supabase = createClient()
  let query = supabase.from('happydog_orders').select('*, clients(name, division)').order('created_at', { ascending: false })
  if (filters?.client_id) query = query.eq('client_id', filters.client_id)
  if (filters?.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createHappyDogOrder(payload: Omit<HappyDogOrder, 'id' | 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('happydog_orders').insert(payload).select().single()
  if (error) throw error
  return data as HappyDogOrder
}

export async function updateHappyDogOrder(id: string, payload: Partial<Omit<HappyDogOrder, 'id' | 'created_at'>>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('happydog_orders').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as HappyDogOrder
}
