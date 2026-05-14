import { createClient } from '../client'
import type { Contact } from '../types'

export async function getContacts(filters?: { client_id?: string; search?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('contacts')
    .select('*, clients(name)')
    .order('name')

  if (filters?.client_id) query = query.eq('client_id', filters.client_id)
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createContact(payload: Omit<Contact, 'id' | 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Contact
}

export async function updateContact(id: string, payload: Partial<Omit<Contact, 'id' | 'created_at'>>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Contact
}

export async function deleteContact(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}
