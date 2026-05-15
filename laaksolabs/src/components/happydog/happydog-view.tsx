'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Search, ChevronRight, Package,
  DollarSign, TrendingUp, CheckCircle, X, Save, Download,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { HappyDogOrder, HappyDogStatus, Client, Division } from '@/lib/supabase/types'
import { DIVISION_LABELS } from '@/lib/constants'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { formatCurrency, calcMargin, formatDate } from '@/lib/utils'
import { exportToCsv } from '@/lib/export-csv'

export type OrderWithClient = HappyDogOrder & {
  clients: { name: string; division: Division } | null
}

const STATUS_ORDER: HappyDogStatus[] = [
  'not_ordered', 'ordered', 'in_progress', 'review', 'delivered', 'revision',
]

const STATUS_NEXT: Partial<Record<HappyDogStatus, HappyDogStatus>> = {
  not_ordered: 'ordered',
  ordered: 'in_progress',
  in_progress: 'review',
  review: 'delivered',
  revision: 'in_progress',
}

const STATUS_STYLE: Record<HappyDogStatus, { color: string; bg: string; label: string }> = {
  not_ordered: { color: 'var(--text-muted)', bg: 'color-mix(in srgb, var(--text-muted) 10%, transparent)', label: 'Not Ordered' },
  ordered:     { color: 'var(--prospect)',   bg: 'color-mix(in srgb, var(--prospect) 12%, transparent)',   label: 'Ordered' },
  in_progress: { color: 'var(--div2)',       bg: 'color-mix(in srgb, var(--div2) 12%, transparent)',       label: 'In Progress' },
  review:      { color: 'var(--high)',       bg: 'color-mix(in srgb, var(--high) 12%, transparent)',       label: 'Review' },
  delivered:   { color: 'var(--active)',     bg: 'color-mix(in srgb, var(--active) 12%, transparent)',     label: 'Delivered' },
  revision:    { color: 'var(--urgent)',     bg: 'color-mix(in srgb, var(--urgent) 12%, transparent)',     label: 'Revision' },
}

const DIV_BADGE: Record<Division, string> = {
  div1: 'div-badge d1',
  div2: 'div-badge d2',
  div3: 'div-badge d3',
}

interface AddOrderForm {
  client_id: string
  deliverable: string
  status: HappyDogStatus
  hd_cost: string
  client_price: string
  ordered_date: string
  notes: string
}

const EMPTY_FORM: AddOrderForm = {
  client_id: '',
  deliverable: '',
  status: 'not_ordered',
  hd_cost: '',
  client_price: '',
  ordered_date: '',
  notes: '',
}

interface Props {
  initialOrders: OrderWithClient[]
  clients: Client[]
}

export function HappyDogView({ initialOrders, clients }: Props) {
  const supabase = createClient()
  const [orders, setOrders] = useRealtimeTable<OrderWithClient>('happydog_orders', initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<HappyDogStatus | ''>('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddOrderForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [advancingId, setAdvancingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<AddOrderForm>>({})

  // Summary stats
  const stats = useMemo(() => {
    const totalHdCost = orders.reduce((s, o) => s + (o.hd_cost ?? 0), 0)
    const totalRevenue = orders.reduce((s, o) => s + (o.client_price ?? 0), 0)
    const totalProfit = totalRevenue - totalHdCost
    const marginPct = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0
    const byStatus = STATUS_ORDER.reduce((acc, s) => {
      acc[s] = orders.filter(o => o.status === s).length
      return acc
    }, {} as Record<HappyDogStatus, number>)
    return { totalHdCost, totalRevenue, totalProfit, marginPct, byStatus, total: orders.length }
  }, [orders])

  const filtered = useMemo(() => {
    let list = orders
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.deliverable.toLowerCase().includes(q) ||
        (o.clients?.name ?? '').toLowerCase().includes(q)
      )
    }
    if (statusFilter) list = list.filter(o => o.status === statusFilter)
    return list
  }, [orders, search, statusFilter])

  async function advanceStatus(order: OrderWithClient) {
    const next = STATUS_NEXT[order.status]
    if (!next) return
    setAdvancingId(order.id)
    try {
      const update: Partial<HappyDogOrder> = { status: next }
      if (next === 'delivered') update.delivered_date = new Date().toISOString().split('T')[0]
      if (next === 'ordered') update.ordered_date = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('happydog_orders')
        .update(update)
        .eq('id', order.id)
        .select('*, clients(name, division)')
        .single()
      if (!error && data) {
        setOrders(prev => prev.map(o => o.id === order.id ? data as OrderWithClient : o))
      }
    } finally {
      setAdvancingId(null)
    }
  }

  function startEdit(order: OrderWithClient) {
    setEditingId(order.id)
    setEditForm({
      client_id: order.client_id,
      deliverable: order.deliverable,
      status: order.status,
      hd_cost: order.hd_cost != null ? String(order.hd_cost) : '',
      client_price: order.client_price != null ? String(order.client_price) : '',
      ordered_date: order.ordered_date ?? '',
      notes: order.notes ?? '',
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const hdCost = parseFloat(editForm.hd_cost ?? '') || null
      const clientPrice = parseFloat(editForm.client_price ?? '') || null
      const margin = hdCost != null && clientPrice != null ? calcMargin(hdCost, clientPrice) : null
      const { data, error } = await supabase
        .from('happydog_orders')
        .update({
          deliverable: editForm.deliverable,
          status: editForm.status as HappyDogStatus,
          hd_cost: hdCost,
          client_price: clientPrice,
          margin,
          ordered_date: editForm.ordered_date || null,
          notes: editForm.notes || null,
        })
        .eq('id', id)
        .select('*, clients(name, division)')
        .single()
      if (!error && data) {
        setOrders(prev => prev.map(o => o.id === id ? data as OrderWithClient : o))
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  async function addOrder() {
    if (!form.client_id || !form.deliverable) return
    setSaving(true)
    try {
      const hdCost = parseFloat(form.hd_cost) || null
      const clientPrice = parseFloat(form.client_price) || null
      const margin = hdCost != null && clientPrice != null ? calcMargin(hdCost, clientPrice) : null
      const { data, error } = await supabase
        .from('happydog_orders')
        .insert({
          client_id: form.client_id,
          deliverable: form.deliverable,
          status: form.status,
          hd_cost: hdCost,
          client_price: clientPrice,
          margin,
          ordered_date: form.ordered_date || null,
          delivered_date: null,
          notes: form.notes || null,
        })
        .select('*, clients(name, division)')
        .single()
      if (!error && data) {
        setOrders(prev => [data as OrderWithClient, ...prev])
        setForm(EMPTY_FORM)
        setShowAdd(false)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
    <div className="flex-1 overflow-auto">
    <div style={{ padding: '28px 32px', maxWidth: 1600, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="animate-in delay-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Package size={18} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Happy Dog Tracker</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
            White-label fulfillment — orders, margins, and delivery status
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => exportToCsv(`happydog-${new Date().toISOString().slice(0,10)}.csv`, orders.map(o => ({
              Client: o.clients?.name ?? '',
              Division: o.clients ? DIVISION_LABELS[o.clients.division] : '',
              Deliverable: o.deliverable,
              Status: o.status,
              'HD Cost ($)': o.hd_cost ?? '',
              'Client Price ($)': o.client_price ?? '',
              'Margin (%)': o.margin != null ? o.margin.toFixed(1) : '',
              Ordered: o.ordered_date ?? '',
              Delivered: o.delivered_date ?? '',
              Notes: o.notes ?? '',
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
              fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em',
            }}
          >
            <Plus size={13} />
            New Order
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard
          icon={<Package size={14} style={{ color: 'var(--text-muted)' }} />}
          label="Total Orders"
          value={String(stats.total)}
          sub={`${stats.byStatus.delivered} delivered`}
          delay="delay-1"
        />
        <KpiCard
          icon={<DollarSign size={14} style={{ color: 'var(--text-muted)' }} />}
          label="HD Cost"
          value={formatCurrency(stats.totalHdCost)}
          sub="what Happy Dog charges"
          delay="delay-2"
        />
        <KpiCard
          icon={<TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />}
          label="Client Revenue"
          value={formatCurrency(stats.totalRevenue)}
          sub={`${formatCurrency(stats.totalProfit)} profit`}
          delay="delay-3"
        />
        <KpiCard
          icon={<CheckCircle size={14} style={{ color: 'var(--active)' }} />}
          label="Avg Margin"
          value={`${stats.marginPct}%`}
          sub="across all orders"
          accent={stats.marginPct >= 50 ? 'var(--active)' : 'var(--high)'}
          delay="delay-4"
        />
      </div>

      {/* Status Pipeline */}
      <div className="card animate-in delay-3" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <span className="label" style={{ display: 'block', marginBottom: 12 }}>Pipeline</span>
        <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
          {STATUS_ORDER.map((s, i) => {
            const count = stats.byStatus[s]
            const style = STATUS_STYLE[s]
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <button
                  onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                  style={{
                    flex: 1, padding: '10px 12px', border: '1px solid',
                    borderColor: statusFilter === s ? style.color : 'var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: statusFilter === s ? style.bg : 'transparent',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 120ms ease',
                  }}
                >
                  <div className="num" style={{ fontSize: 18, fontWeight: 700, color: style.color }}>{count}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500, letterSpacing: '0.03em' }}>
                    {style.label}
                  </div>
                </button>
                {i < STATUS_ORDER.length - 1 && (
                  <ChevronRight size={12} style={{ color: 'var(--text-faint)', flexShrink: 0, margin: '0 2px' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Table toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search deliverables or clients…"
            style={{
              width: '100%', paddingLeft: 30, paddingRight: 10, height: 34,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12,
              outline: 'none',
            }}
          />
        </div>
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
              background: STATUS_STYLE[statusFilter].bg,
              border: `1px solid ${STATUS_STYLE[statusFilter].color}`,
              borderRadius: 'var(--radius-sm)', color: STATUS_STYLE[statusFilter].color,
              fontSize: 11, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {STATUS_STYLE[statusFilter].label}
            <X size={10} />
          </button>
        )}
        <span className="label" style={{ marginLeft: 'auto' }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Orders Table */}
      <div className="card animate-in delay-5 table-scroll-wrap" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Client', 'Deliverable', 'Status', 'HD Cost', 'Your Price', 'Margin', 'Ordered', 'Delivered', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--text-muted)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No orders found
                </td>
              </tr>
            ) : filtered.map((order) => {
              const isEditing = editingId === order.id
              const isAdvancing = advancingId === order.id
              const s = STATUS_STYLE[order.status]
              const nextStatus = STATUS_NEXT[order.status]
              const margin = order.hd_cost != null && order.client_price != null
                ? calcMargin(order.hd_cost, order.client_price)
                : null

              return (
                <tr
                  key={order.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isEditing ? 'var(--surface-2)' : 'transparent',
                    transition: 'background 120ms ease',
                  }}
                >
                  {/* Client */}
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {order.clients?.division && (
                        <span className={DIV_BADGE[order.clients.division]}>
                          {DIVISION_LABELS[order.clients.division]}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                        {order.clients?.name ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Deliverable */}
                  <td style={{ padding: '11px 14px', maxWidth: 200 }}>
                    {isEditing ? (
                      <input
                        value={editForm.deliverable ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, deliverable: e.target.value }))}
                        style={{
                          width: '100%', padding: '4px 8px',
                          background: 'var(--surface-3)', border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text)' }}>{order.deliverable}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <select
                        value={editForm.status ?? order.status}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value as HappyDogStatus }))}
                        style={{
                          padding: '4px 8px', background: 'var(--surface-3)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 11,
                        }}
                      >
                        {STATUS_ORDER.map(st => (
                          <option key={st} value={st}>{STATUS_STYLE[st].label}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.03em',
                        color: s.color, background: s.bg,
                      }}>
                        {s.label}
                      </span>
                    )}
                  </td>

                  {/* HD Cost */}
                  <td style={{ padding: '11px 14px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.hd_cost ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, hd_cost: e.target.value }))}
                        placeholder="0"
                        style={{
                          width: 80, padding: '4px 8px',
                          background: 'var(--surface-3)', border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12,
                        }}
                      />
                    ) : (
                      <span className="num" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {order.hd_cost != null ? formatCurrency(order.hd_cost) : '—'}
                      </span>
                    )}
                  </td>

                  {/* Your Price */}
                  <td style={{ padding: '11px 14px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.client_price ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, client_price: e.target.value }))}
                        placeholder="0"
                        style={{
                          width: 80, padding: '4px 8px',
                          background: 'var(--surface-3)', border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12,
                        }}
                      />
                    ) : (
                      <span className="num" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
                        {order.client_price != null ? formatCurrency(order.client_price) : '—'}
                      </span>
                    )}
                  </td>

                  {/* Margin */}
                  <td style={{ padding: '11px 14px' }}>
                    <span className="num" style={{
                      fontSize: 12, fontWeight: 700,
                      color: margin != null ? (margin >= 50 ? 'var(--active)' : margin >= 30 ? 'var(--high)' : 'var(--urgent)') : 'var(--text-faint)',
                    }}>
                      {margin != null ? `${margin}%` : '—'}
                    </span>
                  </td>

                  {/* Ordered */}
                  <td style={{ padding: '11px 14px' }}>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.ordered_date ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, ordered_date: e.target.value }))}
                        style={{
                          padding: '4px 8px', background: 'var(--surface-3)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 11,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {order.ordered_date ? formatDate(order.ordered_date) : '—'}
                      </span>
                    )}
                  </td>

                  {/* Delivered */}
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 11, color: order.delivered_date ? 'var(--active)' : 'var(--text-faint)' }}>
                      {order.delivered_date ? formatDate(order.delivered_date) : '—'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => saveEdit(order.id)}
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
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {nextStatus && (
                          <button
                            onClick={() => advanceStatus(order)}
                            disabled={isAdvancing}
                            title={`Mark as ${STATUS_STYLE[nextStatus].label}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 9px',
                              background: STATUS_STYLE[nextStatus].bg,
                              border: `1px solid ${STATUS_STYLE[nextStatus].color}`,
                              borderRadius: 'var(--radius-sm)',
                              color: STATUS_STYLE[nextStatus].color,
                              fontSize: 10, fontWeight: 600, cursor: 'pointer',
                              opacity: isAdvancing ? 0.5 : 1, transition: 'opacity 120ms',
                            }}
                          >
                            <ChevronRight size={10} />
                            {STATUS_STYLE[nextStatus].label}
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(order)}
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
        </table>
      </div>

      {/* Add Order Modal */}
      {showAdd && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, backdropFilter: 'blur(4px)',
          }}
        >
          <div className="card animate-in" style={{ width: 480, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>New Happy Dog Order</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Client *">
                <select
                  value={form.client_id}
                  onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  style={selectStyle}
                >
                  <option value="">Select client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Deliverable *">
                <input
                  value={form.deliverable}
                  onChange={e => setForm(f => ({ ...f, deliverable: e.target.value }))}
                  placeholder="e.g. Brand Kit, Landing Page — Windows"
                  style={inputStyle}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="HD Cost ($)">
                  <input
                    type="number"
                    value={form.hd_cost}
                    onChange={e => setForm(f => ({ ...f, hd_cost: e.target.value }))}
                    placeholder="2500"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Your Price ($)">
                  <input
                    type="number"
                    value={form.client_price}
                    onChange={e => setForm(f => ({ ...f, client_price: e.target.value }))}
                    placeholder="5000"
                    style={inputStyle}
                  />
                </Field>
              </div>

              {form.hd_cost && form.client_price && (
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-3)', border: '1px solid var(--border)',
                  display: 'flex', gap: 20,
                }}>
                  <div>
                    <span className="label">Profit</span>
                    <div className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--active)', marginTop: 2 }}>
                      {formatCurrency((parseFloat(form.client_price) || 0) - (parseFloat(form.hd_cost) || 0))}
                    </div>
                  </div>
                  <div>
                    <span className="label">Margin</span>
                    <div className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--active)', marginTop: 2 }}>
                      {calcMargin(parseFloat(form.hd_cost) || 0, parseFloat(form.client_price) || 0)}%
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as HappyDogStatus }))}
                    style={selectStyle}
                  >
                    {STATUS_ORDER.map(s => (
                      <option key={s} value={s}>{STATUS_STYLE[s].label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ordered Date">
                  <input
                    type="date"
                    value={form.ordered_date}
                    onChange={e => setForm(f => ({ ...f, ordered_date: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any details about scope, timeline, or references…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
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
                onClick={addOrder}
                disabled={saving || !form.client_id || !form.deliverable}
                style={{
                  padding: '8px 18px', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius)',
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  opacity: saving || !form.client_id || !form.deliverable ? 0.5 : 1,
                }}
              >
                {saving ? 'Adding…' : 'Add Order'}
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
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent?: string
  delay: string
}) {
  return (
    <div className={`card animate-in ${delay}`} style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon}
        <span className="label">{label}</span>
      </div>
      <div className="num" style={{ fontSize: 24, fontWeight: 700, color: accent ?? 'var(--text)', lineHeight: 1 }}>
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
  borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12,
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}
