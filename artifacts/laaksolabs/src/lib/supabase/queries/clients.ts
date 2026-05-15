import { createClient } from '../client'
import type { Client, ClientStatus, Division } from '../types'

export async function getClients(filters?: { division?: Division; status?: ClientStatus }) {
  const supabase = createClient()
  let query = supabase.from('clients').select('*').order('name')
  if (filters?.division) query = query.eq('division', filters.division)
  if (filters?.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw error
  return data as Client[]
}

export async function updateClient(id: string, payload: Partial<Omit<Client, 'id' | 'created_at'>>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data as Client
}
