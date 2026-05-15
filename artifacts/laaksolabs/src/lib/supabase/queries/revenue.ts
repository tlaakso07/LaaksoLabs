import { createClient } from '../client'
import type { RevenueEntry, RevenueStatus } from '../types'
import { getFirstOfMonth } from '../../utils'

export async function getRevenueEntries(filters?: { month?: string; status?: RevenueStatus; client_id?: string }) {
  const supabase = createClient()
  let query = supabase.from('revenue_entries').select('*, clients(name, division)').order('month', { ascending: false })
  if (filters?.month) query = query.eq('month', filters.month)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.client_id) query = query.eq('client_id', filters.client_id)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createRevenueEntry(payload: Omit<RevenueEntry, 'id' | 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('revenue_entries').insert(payload).select().single()
  if (error) throw error
  return data as RevenueEntry
}

export async function updateRevenueEntry(id: string, payload: Partial<Omit<RevenueEntry, 'id' | 'created_at'>>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('revenue_entries').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as RevenueEntry
}

export async function getMRRByMonth(months = 6) {
  const supabase = createClient()
  const results = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const month = getFirstOfMonth(d)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const { data } = await supabase
      .from('revenue_entries').select('amount, clients(division)').eq('month', month).eq('status', 'paid')
    const e = data ?? []
    type R = { amount: number; clients: { division: string } | null }
    const rows = e as unknown as R[]
    const byDiv = (div: string) => rows.filter(r => r.clients?.division === div).reduce((s, r) => s + r.amount, 0)
    results.push({ month: label, div1: byDiv('div1'), div2: byDiv('div2'), div3: byDiv('div3'), total: byDiv('div1') + byDiv('div2') + byDiv('div3') })
  }
  return results
}
