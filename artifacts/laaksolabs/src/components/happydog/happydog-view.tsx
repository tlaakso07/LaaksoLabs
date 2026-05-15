import { useState, useMemo } from 'react'
import { Plus, Search, Package, DollarSign, TrendingUp, CheckCircle, X, Save, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { HappyDogOrder, HappyDogStatus, Client, Division } from '@/lib/supabase/types'
import { DIVISION_LABELS } from '@/lib/constants'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { formatCurrency, calcMargin, formatDate } from '@/lib/utils'
import { exportToCsv } from '@/lib/export-csv'

export type OrderWithClient = HappyDogOrder & { clients: { name: string; division: Division } | null }

const STATUS_NEXT: Partial<Record<HappyDogStatus, HappyDogStatus>> = { not_ordered: 'ordered', ordered: 'in_progress', in_progress: 'review', review: 'delivered', revision: 'in_progress' }
const STATUS_STYLE: Record<HappyDogStatus, { color: string; bg: string; label: string }> = {
  not_ordered: { color: 'var(--text-muted)', bg: 'color-mix(in srgb, var(--text-muted) 10%, transparent)', label: 'Not Ordered' },
  ordered:     { color: 'var(--prospect)',   bg: 'color-mix(in srgb, var(--prospect) 12%, transparent)',   label: 'Ordered' },
  in_progress: { color: 'var(--div2)',       bg: 'color-mix(in srgb, var(--div2) 12%, transparent)',       label: 'In Progress' },
  review:      { color: 'var(--high)',       bg: 'color-mix(in srgb, var(--high) 12%, transparent)',       label: 'Review' },
  delivered:   { color: 'var(--active)',     bg: 'color-mix(in srgb, var(--active) 12%, transparent)',     label: 'Delivered' },
  revision:    { color: 'var(--urgent)',     bg: 'color-mix(in srgb, var(--urgent) 12%, transparent)',     label: 'Revision' },
}
const STATUS_ORDER: HappyDogStatus[] = ['not_ordered', 'ordered', 'in_progress', 'review', 'delivered', 'revision']
const INPUT: React.CSSProperties = { padding: '7px 10px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%' }

function KpiCard({ icon, label, value, sub, accent, delay }: { icon: React.ReactNode; label: string; value: string; sub: string; accent?: string; delay?: string }) {
  return (
    <div className={`card animate-in ${delay ?? ''}`} style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--text-muted)' }}>{icon}<span className="label">{label}</span></div>
      <p className="num" style={{ fontSize: '24px', fontWeight: 700, color: accent ?? 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 4px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: 0 }}>{sub}</p>
    </div>
  )
}

interface AddForm { client_id: string; deliverable: string; status: HappyDogStatus; hd_cost: string; client_price: string; ordered_date: string; notes: string }
const EMPTY_FORM: AddForm = { client_id: '', deliverable: '', status: 'not_ordered', hd_cost: '', client_price: '', ordered_date: '', notes: '' }

export function HappyDogView({ initialOrders, clients }: { initialOrders: OrderWithClient[]; clients: Client[] }) {
  const sb = createClient()
  const [orders, setOrders] = useRealtimeTable<OrderWithClient>('happydog_orders', initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<HappyDogStatus | ''>('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [advancingId, setAdvancingId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const totalHdCost = orders.reduce((s, o) => s + (o.hd_cost ?? 0), 0)
    const totalRevenue = orders.reduce((s, o) => s + (o.client_price ?? 0), 0)
    const totalProfit = totalRevenue - totalHdCost
    const marginPct = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0
    const byStatus = STATUS_ORDER.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc }, {} as Record<HappyDogStatus, number>)
    return { totalHdCost, totalRevenue, totalProfit, marginPct, byStatus, total: orders.length }
  }, [orders])

  const filtered = useMemo(() => {
    let list = orders
    if (search) { const q = search.toLowerCase(); list = list.filter(o => o.deliverable.toLowerCase().includes(q) || (o.clients?.name ?? '').toLowerCase().includes(q)) }
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
      const { data, error } = await sb.from('happydog_orders').update(update).eq('id', order.id).select('*, clients(name, division)').single()
      if (!error && data) setOrders(prev => prev.map(o => o.id === order.id ? data as OrderWithClient : o))
    } finally { setAdvancingId(null) }
  }

  async function addOrder() {
    if (!form.client_id || !form.deliverable) return
    setSaving(true)
    try {
      const hdCost = parseFloat(form.hd_cost) || null
      const clientPrice = parseFloat(form.client_price) || null
      const margin = hdCost != null && clientPrice != null ? calcMargin(hdCost, clientPrice) : null
      const { data, error } = await sb.from('happydog_orders').insert({ client_id: form.client_id, deliverable: form.deliverable, status: form.status, hd_cost: hdCost, client_price: clientPrice, margin, ordered_date: form.ordered_date || null, delivered_date: null, notes: form.notes || null }).select('*, clients(name, division)').single()
      if (!error && data) { setOrders(prev => [data as OrderWithClient, ...prev]); setForm(EMPTY_FORM); setShowAdd(false) }
    } finally { setSaving(false) }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Package size={18} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Happy Dog Tracker</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>White-label fulfillment — orders, margins, and delivery status</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => exportToCsv(`happydog-${new Date().toISOString().slice(0,10)}.csv`, orders.map(o => ({ Client: o.clients?.name ?? '', Deliverable: o.deliverable, Status: o.status, 'HD Cost ($)': o.hd_cost ?? '', 'Client Price ($)': o.client_price ?? '', Ordered: o.ordered_date ?? '', Delivered: o.delivered_date ?? '' })))} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}><Download size={13} /> CSV</button>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}><Plus size={13} /> New Order</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <KpiCard icon={<Package size={14} />} label="Total Orders" value={String(stats.total)} sub={`${stats.byStatus.delivered} delivered`} delay="delay-1" />
        <KpiCard icon={<DollarSign size={14} />} label="HD Cost" value={formatCurrency(stats.totalHdCost)} sub="what Happy Dog charges" delay="delay-2" />
        <KpiCard icon={<TrendingUp size={14} />} label="Client Revenue" value={formatCurrency(stats.totalRevenue)} sub={`${formatCurrency(stats.totalProfit)} profit`} delay="delay-3" />
        <KpiCard icon={<CheckCircle size={14} style={{ color: 'var(--active)' }} />} label="Avg Margin" value={`${stats.marginPct}%`} sub="across all orders" accent={stats.marginPct >= 50 ? 'var(--active)' : 'var(--high)'} delay="delay-4" />
      </div>

      <div className="card animate-in delay-3" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <span className="label" style={{ display: 'block', marginBottom: '12px' }}>Pipeline</span>
        <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
          {STATUS_ORDER.map((s, i) => {
            const count = stats.byStatus[s]
            const style = STATUS_STYLE[s]
            const active = statusFilter === s
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <button onClick={() => setStatusFilter(active ? '' : s)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 6px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: active ? style.bg : 'transparent', color: active ? style.color : 'var(--text-muted)', transition: 'all 100ms ease' }}>
                  <span className="num" style={{ fontSize: '22px', fontWeight: 700, color: count > 0 ? style.color : 'var(--text-faint)' }}>{count}</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{style.label}</span>
                </button>
                {i < STATUS_ORDER.length - 1 && <div style={{ width: '1px', height: '28px', background: 'var(--border)', flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." style={{ ...INPUT, paddingLeft: '30px', width: '220px' }} />
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ fontSize: '14px', color: 'var(--text-faint)' }}>No orders found.</p></div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                  {['Client', 'Deliverable', 'Status', 'HD Cost', 'Your Price', 'Margin', 'Dates', ''].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', position: 'sticky', top: 0, background: 'var(--surface-1)' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const margin = calcMargin(order.hd_cost ?? 0, order.client_price ?? 0)
                  const ss = STATUS_STYLE[order.status]
                  return (
                    <tr key={order.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '12px 14px' }}>
                        {order.clients ? <><p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{order.clients.name}</p><p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '2px 0 0' }}>{DIVISION_LABELS[order.clients.division]}</p></> : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}><p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>{order.deliverable}</p>{order.notes && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{order.notes}</p>}</td>
                      <td style={{ padding: '12px 14px' }}><span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', background: ss.bg, color: ss.color, border: `1px solid ${ss.color}35`, whiteSpace: 'nowrap' }}>{ss.label}</span></td>
                      <td style={{ padding: '12px 14px' }}><span className="num" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{order.hd_cost ? formatCurrency(order.hd_cost) : '—'}</span></td>
                      <td style={{ padding: '12px 14px' }}><span className="num" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{order.client_price ? formatCurrency(order.client_price) : '—'}</span></td>
                      <td style={{ padding: '12px 14px' }}><span className="num" style={{ fontSize: '13px', fontWeight: 700, color: margin >= 50 ? 'var(--active)' : margin >= 30 ? 'var(--medium)' : 'var(--text-muted)' }}>{order.client_price ? `${margin}%` : '—'}</span></td>
                      <td style={{ padding: '12px 14px' }}><div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.6 }}>{order.ordered_date && <div>Ord: {formatDate(order.ordered_date)}</div>}{order.delivered_date && <div>Del: {formatDate(order.delivered_date)}</div>}{!order.ordered_date && !order.delivered_date && '—'}</div></td>
                      <td style={{ padding: '12px 14px' }}>
                        {STATUS_NEXT[order.status] && (
                          <button onClick={() => advanceStatus(order)} disabled={advancingId === order.id} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid', cursor: 'pointer', background: ss.bg, color: ss.color, borderColor: `color-mix(in srgb, ${ss.color} 30%, transparent)`, whiteSpace: 'nowrap' }}>
                            → {STATUS_STYLE[STATUS_NEXT[order.status]!].label}
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
          <div style={{ width: '100%', maxWidth: '480px', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>New Happy Dog Order</p>
              <button onClick={() => setShowAdd(false)} style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={12} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={INPUT}><option value="">Select client *</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input value={form.deliverable} onChange={e => setForm(f => ({ ...f, deliverable: e.target.value }))} placeholder="Deliverable *" style={INPUT} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input value={form.hd_cost} onChange={e => setForm(f => ({ ...f, hd_cost: e.target.value }))} placeholder="HD Cost ($)" type="number" style={INPUT} />
                <input value={form.client_price} onChange={e => setForm(f => ({ ...f, client_price: e.target.value }))} placeholder="Client Price ($)" type="number" style={INPUT} />
              </div>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as HappyDogStatus }))} style={INPUT}>{STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}</select>
              <input value={form.ordered_date} onChange={e => setForm(f => ({ ...f, ordered_date: e.target.value }))} type="date" style={INPUT} placeholder="Ordered date" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes..." rows={2} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.5 }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={addOrder} disabled={!form.client_id || !form.deliverable || saving} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: !form.client_id || !form.deliverable || saving ? 0.6 : 1 }}>
                  <Save size={12} /> {saving ? 'Adding...' : 'Add Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
