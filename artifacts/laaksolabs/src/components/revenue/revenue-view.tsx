import { useState, useMemo } from 'react'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Plus, X, Save, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { RevenueEntry, RevenueStatus, RevenueType, Client, Division } from '@/lib/supabase/types'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { REVENUE_TARGET, DIVISION_LABELS, REVENUE_STATUS_LABELS } from '@/lib/constants'
import { formatCurrency, formatCurrencyShort, getFirstOfMonth } from '@/lib/utils'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { exportToCsv } from '@/lib/export-csv'

export type EntryWithClient = RevenueEntry & { clients: { name: string; division: Division } | null }

const STATUS_STYLE: Record<RevenueStatus, { color: string; bg: string }> = {
  expected: { color: 'var(--text-muted)',  bg: 'color-mix(in srgb, var(--text-muted) 10%, transparent)' },
  invoiced: { color: 'var(--prospect)',    bg: 'color-mix(in srgb, var(--prospect) 12%, transparent)' },
  paid:     { color: 'var(--active)',      bg: 'color-mix(in srgb, var(--active) 12%, transparent)' },
  overdue:  { color: 'var(--urgent)',      bg: 'color-mix(in srgb, var(--urgent) 12%, transparent)' },
}
const STATUS_NEXT: Partial<Record<RevenueStatus, RevenueStatus>> = { expected: 'invoiced', invoiced: 'paid' }
const TYPE_STYLE: Record<RevenueType, { color: string; label: string }> = {
  retainer: { color: 'var(--div2)', label: 'Retainer' },
  project:  { color: 'var(--accent)', label: 'Project' },
  equity:   { color: 'var(--active)', label: 'Equity' },
  other:    { color: 'var(--text-muted)', label: 'Other' },
}
const REVENUE_TYPES: RevenueType[] = ['retainer', 'project', 'equity', 'other']
const REVENUE_STATUSES: RevenueStatus[] = ['expected', 'invoiced', 'paid', 'overdue']
const INPUT: React.CSSProperties = { padding: '7px 10px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%' }

function monthLabel(iso: string): string { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) }
function monthFull(iso: string): string { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
function addMonths(iso: string, n: number): string { const d = new Date(iso + 'T12:00:00'); d.setMonth(d.getMonth() + n); return getFirstOfMonth(d) }

export function RevenueView({ initialEntries, clients }: { initialEntries: EntryWithClient[]; clients: Client[] }) {
  const sb = createClient()
  const [entries, setEntries] = useRealtimeTable<EntryWithClient>('revenue_entries', initialEntries)
  const [selectedMonth, setSelectedMonth] = useState(getFirstOfMonth())
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ client_id: '', amount: '', type: 'retainer' as RevenueType, status: 'expected' as RevenueStatus, notes: '' })
  const [saving, setSaving] = useState(false)
  const [advancingId, setAdvancingId] = useState<string | null>(null)

  const chartData = useMemo(() => {
    const months: string[] = []
    for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); months.push(getFirstOfMonth(d)) }
    return months.map(m => {
      const me = entries.filter(e => e.month === m && e.status === 'paid')
      const div1 = me.filter(e => e.clients?.division === 'div1').reduce((s, e) => s + e.amount, 0)
      const div2 = me.filter(e => e.clients?.division === 'div2').reduce((s, e) => s + e.amount, 0)
      const div3 = me.filter(e => e.clients?.division === 'div3').reduce((s, e) => s + e.amount, 0)
      return { month: monthLabel(m), div1, div2, div3, total: div1 + div2 + div3 }
    })
  }, [entries])

  const monthEntries = useMemo(() => entries.filter(e => e.month === selectedMonth), [entries, selectedMonth])
  const kpis = useMemo(() => {
    const paid = monthEntries.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0)
    const outstanding = monthEntries.filter(e => ['invoiced', 'expected'].includes(e.status)).reduce((s, e) => s + e.amount, 0)
    const overdue = entries.filter(e => e.status === 'overdue').reduce((s, e) => s + e.amount, 0)
    const overdueCount = entries.filter(e => e.status === 'overdue').length
    const pct = Math.min(100, Math.round((paid / REVENUE_TARGET) * 100))
    return { paid, outstanding, overdue, overdueCount, pct }
  }, [monthEntries, entries])

  const overdueEntries = useMemo(() => entries.filter(e => e.status === 'overdue'), [entries])

  async function advanceStatus(entry: EntryWithClient) {
    const next = STATUS_NEXT[entry.status]
    if (!next) return
    setAdvancingId(entry.id)
    try {
      const { data, error } = await sb.from('revenue_entries').update({ status: next }).eq('id', entry.id).select('*, clients(name, division)').single()
      if (!error && data) setEntries(prev => prev.map(e => e.id === entry.id ? data as EntryWithClient : e))
    } finally { setAdvancingId(null) }
  }

  async function addEntry() {
    if (!form.client_id || !form.amount) return
    setSaving(true)
    try {
      const { data, error } = await sb.from('revenue_entries').insert({ client_id: form.client_id, amount: parseFloat(form.amount), type: form.type, month: selectedMonth, status: form.status, notes: form.notes || null }).select('*, clients(name, division)').single()
      if (!error && data) { setEntries(prev => [data as EntryWithClient, ...prev]); setForm({ client_id: '', amount: '', type: 'retainer', status: 'expected', notes: '' }); setShowAdd(false) }
    } finally { setSaving(false) }
  }

  const canGoBack = selectedMonth > '2025-01-01'
  const canGoForward = selectedMonth < addMonths(getFirstOfMonth(), 2)

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 32px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <DollarSign size={18} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Revenue</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>MRR tracking, invoice status, and progress toward $200K</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => exportToCsv(`revenue-${new Date().toISOString().slice(0,10)}.csv`, entries.map(e => ({ Client: e.clients?.name ?? '', Division: e.clients ? DIVISION_LABELS[e.clients.division] : '', 'Amount ($)': e.amount, Type: e.type, Month: e.month.slice(0, 7), Status: REVENUE_STATUS_LABELS[e.status], Notes: e.notes ?? '' })))} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}><Download size={13} /> CSV</button>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}><Plus size={13} /> Add Entry</button>
        </div>
      </div>

      {overdueEntries.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '20px', background: 'color-mix(in srgb, var(--urgent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--urgent) 30%, transparent)', borderRadius: 'var(--radius)' }}>
          <AlertCircle size={14} style={{ color: 'var(--urgent)', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--urgent)', fontWeight: 600 }}>{overdueEntries.length} overdue invoice{overdueEntries.length > 1 ? 's' : ''} — {formatCurrency(kpis.overdue)} outstanding</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>{overdueEntries.map(e => e.clients?.name).filter(Boolean).join(', ')}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div className="card animate-in delay-1" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><TrendingUp size={14} style={{ color: 'var(--text-muted)' }} /><span className="label">MRR Progress</span></div>
          <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{kpis.pct}%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '5px 0 10px' }}>{formatCurrency(kpis.paid)} of {formatCurrency(REVENUE_TARGET)}</div>
          <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', width: `${kpis.pct}%`, background: kpis.pct >= 75 ? 'var(--active)' : kpis.pct >= 40 ? 'var(--high)' : 'var(--accent)', transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>
        <div className="card animate-in delay-2" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><CheckCircle size={14} style={{ color: 'var(--active)' }} /><span className="label">Paid This Month</span></div>
          <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--active)', lineHeight: 1 }}>{formatCurrencyShort(kpis.paid)}</div>
          <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>confirmed revenue</p>
        </div>
        <div className="card animate-in delay-3" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><DollarSign size={14} style={{ color: 'var(--text-muted)' }} /><span className="label">Outstanding</span></div>
          <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: kpis.outstanding > 0 ? 'var(--text)' : 'var(--text-faint)', lineHeight: 1 }}>{formatCurrencyShort(kpis.outstanding)}</div>
          <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>invoiced or expected</p>
        </div>
        <div className="card animate-in delay-4" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><AlertCircle size={14} style={{ color: kpis.overdueCount > 0 ? 'var(--urgent)' : 'var(--text-muted)' }} /><span className="label">Overdue</span></div>
          <div className="num" style={{ fontSize: '24px', fontWeight: 700, color: kpis.overdueCount > 0 ? 'var(--urgent)' : 'var(--text-faint)', lineHeight: 1 }}>{kpis.overdueCount}</div>
          <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>{kpis.overdue > 0 ? formatCurrency(kpis.overdue) + ' total' : 'none outstanding'}</p>
        </div>
      </div>

      <div className="card animate-in delay-2" style={{ padding: '24px', marginBottom: '24px', height: '300px' }}>
        <RevenueChart data={chartData} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => canGoBack && setSelectedMonth(addMonths(selectedMonth, -1))} disabled={!canGoBack} style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: canGoBack ? 'var(--text-muted)' : 'var(--text-faint)', cursor: canGoBack ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={13} /></button>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', minWidth: '160px', textAlign: 'center' }}>{monthFull(selectedMonth)}</h2>
        <button onClick={() => canGoForward && setSelectedMonth(addMonths(selectedMonth, 1))} disabled={!canGoForward} style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: canGoForward ? 'var(--text-muted)' : 'var(--text-faint)', cursor: canGoForward ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={13} /></button>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>{monthEntries.length} entr{monthEntries.length === 1 ? 'y' : 'ies'}</span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {monthEntries.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><p style={{ fontSize: '14px', color: 'var(--text-faint)' }}>No entries for {monthFull(selectedMonth)}.</p></div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                  {['Client', 'Type', 'Amount', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', position: 'sticky', top: 0, background: 'var(--surface-1)' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {monthEntries.map((entry, i) => {
                  const ss = STATUS_STYLE[entry.status]
                  const ts = TYPE_STYLE[entry.type]
                  return (
                    <tr key={entry.id} style={{ borderBottom: i < monthEntries.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{entry.clients?.name ?? '—'}</p>
                        {entry.clients && <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '2px 0 0' }}>{DIVISION_LABELS[entry.clients.division]}</p>}
                        {entry.notes && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0', fontStyle: 'italic' }}>{entry.notes}</p>}
                      </td>
                      <td style={{ padding: '14px 16px' }}><span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', color: ts.color, background: `color-mix(in srgb, ${ts.color} 10%, transparent)` }}>{ts.label}</span></td>
                      <td style={{ padding: '14px 16px' }}><span className="num" style={{ fontSize: '16px', fontWeight: 700, color: entry.status === 'paid' ? 'var(--active)' : 'var(--text)', letterSpacing: '-0.02em' }}>{formatCurrency(entry.amount)}</span></td>
                      <td style={{ padding: '14px 16px' }}><span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: ss.bg, color: ss.color, border: `1px solid ${ss.color}35`, whiteSpace: 'nowrap' }}>{REVENUE_STATUS_LABELS[entry.status]}</span></td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {STATUS_NEXT[entry.status] && (
                          <button onClick={() => advanceStatus(entry)} disabled={advancingId === entry.id} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid', cursor: 'pointer', background: `color-mix(in srgb, ${STATUS_STYLE[STATUS_NEXT[entry.status]!].color} 10%, transparent)`, color: STATUS_STYLE[STATUS_NEXT[entry.status]!].color, borderColor: `color-mix(in srgb, ${STATUS_STYLE[STATUS_NEXT[entry.status]!].color} 30%, transparent)`, whiteSpace: 'nowrap' }}>
                            Mark {STATUS_NEXT[entry.status]}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{ width: '100%', maxWidth: '440px', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Add Revenue Entry — {monthFull(selectedMonth)}</p>
              <button onClick={() => setShowAdd(false)} style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={12} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={INPUT}><option value="">Select client *</option>{clients.filter(c => c.status === 'active' || c.status === 'onboarding').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount ($) *" type="number" style={INPUT} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as RevenueType }))} style={INPUT}>{REVENUE_TYPES.map(t => <option key={t} value={t}>{TYPE_STYLE[t].label}</option>)}</select>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RevenueStatus }))} style={INPUT}>{REVENUE_STATUSES.map(s => <option key={s} value={s}>{REVENUE_STATUS_LABELS[s]}</option>)}</select>
              </div>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" style={INPUT} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={addEntry} disabled={!form.client_id || !form.amount || saving} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: !form.client_id || !form.amount || saving ? 0.6 : 1 }}>
                  <Save size={12} /> {saving ? 'Adding...' : 'Add Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
