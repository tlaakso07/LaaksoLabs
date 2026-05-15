'use client'

import { useState, useMemo } from 'react'
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight, Plus, X, Save, Download,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { RevenueEntry, RevenueStatus, RevenueType, Client, Division } from '@/lib/supabase/types'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { REVENUE_TARGET, DIVISION_LABELS, REVENUE_STATUS_LABELS } from '@/lib/constants'
import { formatCurrency, formatCurrencyShort, getFirstOfMonth } from '@/lib/utils'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { exportToCsv } from '@/lib/export-csv'

export type EntryWithClient = RevenueEntry & {
  clients: { name: string; division: Division } | null
}

const STATUS_STYLE: Record<RevenueStatus, { color: string; bg: string }> = {
  expected: { color: 'var(--text-muted)',  bg: 'color-mix(in srgb, var(--text-muted)  10%, transparent)' },
  invoiced: { color: 'var(--prospect)',    bg: 'color-mix(in srgb, var(--prospect)    12%, transparent)' },
  paid:     { color: 'var(--active)',      bg: 'color-mix(in srgb, var(--active)      12%, transparent)' },
  overdue:  { color: 'var(--urgent)',      bg: 'color-mix(in srgb, var(--urgent)      12%, transparent)' },
}

const STATUS_NEXT: Partial<Record<RevenueStatus, RevenueStatus>> = {
  expected: 'invoiced',
  invoiced: 'paid',
}

const TYPE_STYLE: Record<RevenueType, { color: string; label: string }> = {
  retainer: { color: 'var(--div2)',       label: 'Retainer' },
  project:  { color: 'var(--accent)',     label: 'Project'  },
  equity:   { color: 'var(--active)',     label: 'Equity'   },
  other:    { color: 'var(--text-muted)', label: 'Other'    },
}

const DIV_BADGE: Record<Division, string> = {
  div1: 'div-badge d1',
  div2: 'div-badge d2',
  div3: 'div-badge d3',
}

const REVENUE_TYPES: RevenueType[] = ['retainer', 'project', 'equity', 'other']
const REVENUE_STATUSES: RevenueStatus[] = ['expected', 'invoiced', 'paid', 'overdue']

function monthLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function monthFull(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function addMonths(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setMonth(d.getMonth() + n)
  return getFirstOfMonth(d)
}

interface AddForm {
  client_id: string
  amount: string
  type: RevenueType
  status: RevenueStatus
  notes: string
}

const EMPTY_FORM: AddForm = {
  client_id: '',
  amount: '',
  type: 'retainer',
  status: 'expected',
  notes: '',
}

interface Props {
  initialEntries: EntryWithClient[]
  clients: Client[]
}

export function RevenueView({ initialEntries, clients }: Props) {
  const supabase = createClient()
  const [entries, setEntries] = useRealtimeTable<EntryWithClient>('revenue_entries', initialEntries)
  const [selectedMonth, setSelectedMonth] = useState(getFirstOfMonth())
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [advancingId, setAdvancingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<RevenueStatus>('expected')

  // ── Chart data: last 6 months ────────────────────────────────────────────
  const chartData = useMemo(() => {
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push(getFirstOfMonth(d))
    }
    return months.map(m => {
      const me = entries.filter(e => e.month === m && e.status === 'paid')
      const div1 = me.filter(e => e.clients?.division === 'div1').reduce((s, e) => s + e.amount, 0)
      const div2 = me.filter(e => e.clients?.division === 'div2').reduce((s, e) => s + e.amount, 0)
      const div3 = me.filter(e => e.clients?.division === 'div3').reduce((s, e) => s + e.amount, 0)
      return { month: monthLabel(m), div1, div2, div3, total: div1 + div2 + div3 }
    })
  }, [entries])

  // ── Selected month entries ───────────────────────────────────────────────
  const monthEntries = useMemo(
    () => entries.filter(e => e.month === selectedMonth),
    [entries, selectedMonth]
  )

  // ── KPIs for selected month ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const paid = monthEntries.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0)
    const outstanding = monthEntries.filter(e => e.status === 'invoiced' || e.status === 'expected').reduce((s, e) => s + e.amount, 0)
    const overdue = entries.filter(e => e.status === 'overdue').reduce((s, e) => s + e.amount, 0)
    const overdueCount = entries.filter(e => e.status === 'overdue').length
    const projected = monthEntries.reduce((s, e) => s + e.amount, 0)
    const pct = Math.min(100, Math.round((paid / REVENUE_TARGET) * 100))
    return { paid, outstanding, overdue, overdueCount, projected, pct }
  }, [monthEntries, entries])

  // ── Division breakdown for selected month ───────────────────────────────
  const divBreakdown = useMemo(() => {
    const divs: Division[] = ['div1', 'div2', 'div3']
    return divs.map(div => {
      const paid = monthEntries.filter(e => e.clients?.division === div && e.status === 'paid').reduce((s, e) => s + e.amount, 0)
      const total = monthEntries.filter(e => e.clients?.division === div).reduce((s, e) => s + e.amount, 0)
      return { div, paid, total }
    })
  }, [monthEntries])

  // ── Overdue entries (all months) ─────────────────────────────────────────
  const overdueEntries = useMemo(
    () => entries.filter(e => e.status === 'overdue'),
    [entries]
  )

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function advanceStatus(entry: EntryWithClient) {
    const next = STATUS_NEXT[entry.status]
    if (!next) return
    setAdvancingId(entry.id)
    try {
      const { data, error } = await supabase
        .from('revenue_entries')
        .update({ status: next })
        .eq('id', entry.id)
        .select('*, clients(name, division)')
        .single()
      if (!error && data) {
        setEntries(prev => prev.map(e => e.id === entry.id ? data as EntryWithClient : e))
      }
    } finally {
      setAdvancingId(null)
    }
  }

  async function saveEditStatus(id: string) {
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('revenue_entries')
        .update({ status: editStatus })
        .eq('id', id)
        .select('*, clients(name, division)')
        .single()
      if (!error && data) {
        setEntries(prev => prev.map(e => e.id === id ? data as EntryWithClient : e))
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  async function addEntry() {
    if (!form.client_id || !form.amount) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('revenue_entries')
        .insert({
          client_id: form.client_id,
          amount: parseFloat(form.amount),
          type: form.type,
          month: selectedMonth,
          status: form.status,
          notes: form.notes || null,
        })
        .select('*, clients(name, division)')
        .single()
      if (!error && data) {
        setEntries(prev => [data as EntryWithClient, ...prev])
        setForm(EMPTY_FORM)
        setShowAdd(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const canGoBack = selectedMonth > '2025-01-01'
  const canGoForward = selectedMonth < addMonths(getFirstOfMonth(), 2)

  return (
    <div className="flex flex-col h-full">
    <div className="flex-1 overflow-auto">
    <div style={{ padding: '28px 32px', maxWidth: 1600, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="animate-in delay-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <DollarSign size={18} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Revenue</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
            MRR tracking, invoice status, and progress toward $200K
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => exportToCsv(`revenue-${new Date().toISOString().slice(0,10)}.csv`, entries.map(e => ({
              Client: e.clients?.name ?? '',
              Division: e.clients ? DIVISION_LABELS[e.clients.division] : '',
              'Amount ($)': e.amount,
              Type: e.type,
              Month: e.month.slice(0, 7),
              Status: REVENUE_STATUS_LABELS[e.status],
              Notes: e.notes ?? '',
            })))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', borderRadius: 'var(--radius)', padding: '8px 12px',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Download size={13} />
            CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius)', padding: '8px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            Add Entry
          </button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueEntries.length > 0 && (
        <div className="animate-in delay-0" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', marginBottom: 20,
          background: 'color-mix(in srgb, var(--urgent) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--urgent) 30%, transparent)',
          borderRadius: 'var(--radius)',
        }}>
          <AlertCircle size={14} style={{ color: 'var(--urgent)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--urgent)', fontWeight: 600 }}>
            {overdueEntries.length} overdue invoice{overdueEntries.length > 1 ? 's' : ''} — {formatCurrency(kpis.overdue)} outstanding
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
            {overdueEntries.map(e => e.clients?.name).filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {/* MRR Progress */}
        <div className="card animate-in delay-1" style={{ padding: '16px 18px', gridColumn: '1 / 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="label">MRR Progress</span>
          </div>
          <div className="num" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
            {kpis.pct}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '5px 0 10px' }}>
            {formatCurrency(kpis.paid)} of {formatCurrency(REVENUE_TARGET)} target
          </div>
          <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${kpis.pct}%`,
              background: kpis.pct >= 75 ? 'var(--active)' : kpis.pct >= 40 ? 'var(--high)' : 'var(--accent)',
              transition: 'width 600ms ease',
            }} />
          </div>
        </div>

        <KpiCard
          icon={<CheckCircle size={14} style={{ color: 'var(--active)' }} />}
          label="Paid This Month"
          value={formatCurrency(kpis.paid)}
          sub={`${monthEntries.filter(e => e.status === 'paid').length} invoices collected`}
          accent="var(--active)"
          delay="delay-2"
        />
        <KpiCard
          icon={<DollarSign size={14} style={{ color: 'var(--text-muted)' }} />}
          label="Outstanding"
          value={formatCurrency(kpis.outstanding)}
          sub={`${monthEntries.filter(e => e.status === 'invoiced' || e.status === 'expected').length} awaiting payment`}
          delay="delay-3"
        />
        <KpiCard
          icon={<AlertCircle size={14} style={{ color: kpis.overdueCount > 0 ? 'var(--urgent)' : 'var(--text-muted)' }} />}
          label="Overdue"
          value={formatCurrency(kpis.overdue)}
          sub={`${kpis.overdueCount} invoice${kpis.overdueCount !== 1 ? 's' : ''} past due`}
          accent={kpis.overdueCount > 0 ? 'var(--urgent)' : undefined}
          delay="delay-4"
        />
      </div>

      {/* Chart + Division breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 24 }}>
        <div className="card animate-in delay-3" style={{ padding: '20px 24px', height: 260 }}>
          <RevenueChart data={chartData} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {divBreakdown.map(({ div, paid, total }, i) => (
            <div key={div} className={`card animate-in delay-${i + 3}`} style={{ padding: '14px 16px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className={DIV_BADGE[div]}>{DIVISION_LABELS[div]}</span>
                <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {formatCurrencyShort(paid)}
                </span>
              </div>
              <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: total > 0 ? `${Math.min(100, Math.round((paid / total) * 100))}%` : '0%',
                  background: div === 'div2' ? 'var(--div2)' : 'var(--div1)',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>
                {total > 0 ? `${Math.round((paid / total) * 100)}% collected` : 'No entries'}
                {total > paid && ` · ${formatCurrencyShort(total - paid)} pending`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month selector + Invoice table */}
      <div className="card animate-in delay-5" style={{ overflow: 'hidden' }}>
        {/* Month nav bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSelectedMonth(m => addMonths(m, -1))}
              disabled={!canGoBack}
              style={{
                padding: '4px 8px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: canGoBack ? 'var(--text-muted)' : 'var(--text-faint)',
                cursor: canGoBack ? 'pointer' : 'default',
              }}
            >
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 130, textAlign: 'center' }}>
              {monthFull(selectedMonth)}
            </span>
            <button
              onClick={() => setSelectedMonth(m => addMonths(m, 1))}
              disabled={!canGoForward}
              style={{
                padding: '4px 8px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: canGoForward ? 'var(--text-muted)' : 'var(--text-faint)',
                cursor: canGoForward ? 'pointer' : 'default',
              }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="label">{monthEntries.length} entries</span>
            <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              {formatCurrency(kpis.projected)} projected
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="table-scroll-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Client', 'Type', 'Amount', 'Status', 'Notes', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--text-muted)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthEntries.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No entries for {monthFull(selectedMonth)} — add one above
                </td>
              </tr>
            ) : monthEntries
              .sort((a, b) => {
                const order = { overdue: 0, invoiced: 1, expected: 2, paid: 3 }
                return order[a.status] - order[b.status]
              })
              .map(entry => {
                const isEditing = editingId === entry.id
                const isAdvancing = advancingId === entry.id
                const ss = STATUS_STYLE[entry.status]
                const ts = TYPE_STYLE[entry.type]
                const nextStatus = STATUS_NEXT[entry.status]

                return (
                  <tr key={entry.id} style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: entry.status === 'overdue' ? 'color-mix(in srgb, var(--urgent) 4%, transparent)' : 'transparent',
                  }}>
                    {/* Client */}
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {entry.clients?.division && (
                          <span className={DIV_BADGE[entry.clients.division]}>
                            {DIVISION_LABELS[entry.clients.division]}
                          </span>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                          {entry.clients?.name ?? '—'}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        color: ts.color,
                        background: `color-mix(in srgb, ${ts.color} 12%, transparent)`,
                      }}>
                        {ts.label}
                      </span>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '11px 16px' }}>
                      <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '11px 16px' }}>
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value as RevenueStatus)}
                          style={{
                            padding: '4px 8px', background: 'var(--surface-3)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 11,
                          }}
                        >
                          {REVENUE_STATUSES.map(s => (
                            <option key={s} value={s}>{REVENUE_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{
                          display: 'inline-block', padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 10, fontWeight: 600,
                          color: ss.color, background: ss.bg,
                        }}>
                          {REVENUE_STATUS_LABELS[entry.status]}
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td style={{ padding: '11px 16px', maxWidth: 200 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {entry.notes ?? '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => saveEditStatus(entry.id)}
                            disabled={saving}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '5px 10px', background: 'var(--accent)',
                              border: 'none', borderRadius: 'var(--radius-sm)',
                              color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            <Save size={11} /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: '5px 8px', background: 'transparent',
                              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {nextStatus && (
                            <button
                              onClick={() => advanceStatus(entry)}
                              disabled={isAdvancing}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 9px',
                                background: STATUS_STYLE[nextStatus].bg,
                                border: `1px solid ${STATUS_STYLE[nextStatus].color}`,
                                borderRadius: 'var(--radius-sm)',
                                color: STATUS_STYLE[nextStatus].color,
                                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                                opacity: isAdvancing ? 0.5 : 1,
                              }}
                            >
                              <ChevronRight size={10} />
                              {REVENUE_STATUS_LABELS[nextStatus]}
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingId(entry.id); setEditStatus(entry.status) }}
                            style={{
                              padding: '4px 9px', background: 'transparent',
                              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>

          {/* Month total footer */}
          {monthEntries.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={2} style={{ padding: '10px 16px' }}>
                  <span className="label">Month Total</span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                    {formatCurrency(kpis.projected)}
                  </span>
                </td>
                <td colSpan={3} style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatCurrency(kpis.paid)} paid · {formatCurrency(kpis.outstanding)} outstanding
                    {kpis.overdue > 0 && <span style={{ color: 'var(--urgent)' }}> · {formatCurrency(kpis.overdue)} overdue</span>}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAdd && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, backdropFilter: 'blur(4px)',
          }}
        >
          <div className="card animate-in" style={{ width: 440, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Add Revenue Entry — {monthFull(selectedMonth)}
              </h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Client *">
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={selectStyle}>
                  <option value="">Select client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Amount ($) *">
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="7500"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Type">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as RevenueType }))} style={selectStyle}>
                    {REVENUE_TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_STYLE[t].label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RevenueStatus }))} style={selectStyle}>
                  {REVENUE_STATUSES.map(s => (
                    <option key={s} value={s}>{REVENUE_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </Field>

              <Field label="Notes">
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. May retainer — paid via ACH"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  padding: '8px 16px', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                disabled={saving || !form.client_id || !form.amount}
                style={{
                  padding: '8px 18px', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius)',
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  opacity: saving || !form.client_id || !form.amount ? 0.5 : 1,
                }}
              >
                {saving ? 'Adding…' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, accent, delay }: {
  icon: React.ReactNode; label: string; value: string
  sub: string; accent?: string; delay: string
}) {
  return (
    <div className={`card animate-in ${delay}`} style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon}
        <span className="label">{label}</span>
      </div>
      <div className="num" style={{ fontSize: 22, fontWeight: 700, color: accent ?? 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 5 }} className="label">{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12, outline: 'none',
}

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
