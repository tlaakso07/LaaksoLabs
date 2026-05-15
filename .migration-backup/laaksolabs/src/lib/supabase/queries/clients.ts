import { createClient } from '../client'
import type { Client, ClientStatus, Division } from '../types'

export async function getClients(filters?: {
  division?: Division
  status?: ClientStatus
}) {
  const supabase = createClient()
  let query = supabase.from('clients').select('*').order('name')

  if (filters?.division) query = query.eq('division', filters.division)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data as Client[]
}

export async function getClient(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Client
}

export async function createClient_(payload: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export async function updateClient(id: string, payload: Partial<Omit<Client, 'id' | 'created_at'>>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export async function deleteClient(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export async function getActiveClientsMRR(): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('retainer_amount')
    .eq('status', 'active')
  if (error) throw error
  return (data ?? []).reduce((sum, c) => sum + (c.retainer_amount ?? 0), 0)
}

export async function getPipelineValue(): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('retainer_amount')
    .in('status', ['lead', 'proposal'])
  if (error) throw error
  return (data ?? []).reduce((sum, c) => sum + (c.retainer_amount ?? 0), 0)
}
