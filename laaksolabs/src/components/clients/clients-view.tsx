'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Plus, LayoutList, Columns3,
  Phone, MapPin, ChevronRight, ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import type { Client, Division, ClientStatus } from '@/lib/supabase/types'
import {
  DIVISION_LABELS,
  CLIENT_STATUS_LABELS, PIPELINE_STATUSES,
} from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { AddClientModal } from './add-client-modal'

const SERVICE_LABELS: Record<string, string> = {
  meta_ads: 'Meta',
  google_ads: 'Google',
  seo: 'SEO',
  brand_kit: 'Brand Kit',
}

const DIV_CLASSES: Record<Division, string> = {
  div1: 'div-badge d1',
  div2: 'div-badge d2',
  div3: 'div-badge d3',
}

const STATUS_DOT: Record<ClientStatus, string> = {
  prospect: 'dot dot-prospect',
  lead: 'dot dot-lead',
  proposal: 'dot dot-proposal',
  onboarding: 'dot dot-onboarding',
  active: 'dot dot-active',
  paused: 'dot dot-paused',
  churned: 'dot dot-churned',
}

const STATUS_COLOR: Record<ClientStatus, string> = {
  prospect: 'var(--prospect)',
  lead: 'var(--prospect)',
  proposal: 'var(--div2)',
  onboarding: 'var(--onboard)',
  active: 'var(--active)',
  paused: 'var(--paused)',
  churned: 'var(--paused)',
}

const ALL_STATUSES: ClientStatus[] = ['prospect', 'lead', 'proposal', 'onboarding', 'active', 'paused', 'churned']

type View = 'list' | 'kanban'

interface Props {
  initialClients: Client[]
}

export function ClientsView({ initialClients }: Props) {
  const [clients, setClients] = useRealtimeTable<Client>('clients', initialClients)
  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')
  const [divFilter, setDivFilter] = useState<Division | ''>('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = useMemo(() => {
    let list = clients
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.owner_name ?? '').toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q)
      )
    }
    if (divFilter) list = list.filter(c => c.division === divFilter)
    if (statusFilter) list = list.filter(c => c.status === statusFilter)
    return list
  }, [clients, search, divFilter, statusFilter])

  const activeCount = clients.filter(c => c.status === 'active').length
  const activeMRR = clients.filter(c => c.status === 'active').reduce((s, c) => s + (c.retainer_amount ?? 0), 0)
  const pipelineValue = clients.filter(c => ['lead', 'proposal'].includes(c.status)).reduce((s, c) => s + (c.retainer_amount ?? 0), 0)

  async function updateStatus(id: string, status: ClientStatus) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    const supabase = createClient()
    await supabase.from('clients').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Clients
            </h1>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
              <Stat label="Total" value={String(clients.length)} />
              <Stat label="Active" value={String(activeCount)} />
              <Stat label="MRR" value={activeMRR > 0 ? formatCurrency(activeMRR) : '—'} accent />
              <Stat label="Pipeline" value={pipelineValue > 0 ? formatCurrency(pipelineValue) : '—'} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{
              display: 'flex', gap: '2px', padding: '3px',
              background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)',
            }}>
              {([['list', LayoutList], ['kanban', Columns3]] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '5px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: view === v ? 'var(--surface-3)' : 'transparent',
                    color: view === v ? 'var(--text)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 100ms ease',
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px',
                background: 'var(--accent)', border: 'none', color: '#fff',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                letterSpacing: '-0.01em',
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Client
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            position: 'relative', flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-faint)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              style={{
                paddingLeft: '30px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
                fontSize: '13px', background: 'var(--surface-1)',
                border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)',
                outline: 'none', width: '220px', fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {['', 'div1', 'div2', 'div3'].map(d => (
              <FilterPill
                key={d}
                active={divFilter === d}
                onClick={() => setDivFilter(d as Division | '')}
              >
                {d === '' ? 'All Divs' : DIVISION_LABELS[d as Division]}
              </FilterPill>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <FilterPill active={statusFilter === ''} onClick={() => setStatusFilter('')}>All Status</FilterPill>
            {ALL_STATUSES.map(s => (
              <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {CLIENT_STATUS_LABELS[s]}
              </FilterPill>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {view === 'list'
          ? <ListView clients={filtered} onStatusChange={updateStatus} />
          : <KanbanView clients={filtered} onStatusChange={updateStatus} />
        }
      </div>

      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onAdded={client => {
            setClients(prev => [client, ...prev])
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ clients, onStatusChange }: { clients: Client[]; onStatusChange: (id: string, status: ClientStatus) => void }) {
  if (clients.length === 0) {
    return <EmptyState message="No clients match your filters." />
  }

  return (
    <div className="table-scroll-wrap">
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          {['Client', 'Status', 'Retainer', 'Location', 'Services', ''].map(h => (
            <th key={h} style={{
              padding: '10px 20px', textAlign: 'left',
              fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--text-faint)',
              position: 'sticky', top: 0, background: 'var(--surface-1)',
              borderBottom: '1px solid var(--border)',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {clients.map((client, i) => (
          <ClientRow key={client.id} client={client} isLast={i === clients.length - 1} onStatusChange={onStatusChange} />
        ))}
      </tbody>
    </table>
    </div>
  )
}

function ClientRow({ client, isLast, onStatusChange }: {
  client: Client
  isLast: boolean
  onStatusChange: (id: string, status: ClientStatus) => void
}) {
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <tr
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        transition: 'background 80ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Client name */}
      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link
            href={`/clients/${client.id}`}
            style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--text)',
              textDecoration: 'none', letterSpacing: '-0.01em',
            }}
          >
            {client.name}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={DIV_CLASSES[client.division]}>
              {DIVISION_LABELS[client.division]}
            </span>
            {client.owner_name && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{client.owner_name}</span>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td style={{ padding: '14px 20px' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setStatusOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 8px', borderRadius: '6px',
              background: 'transparent', border: '1px solid transparent',
              cursor: 'pointer', transition: 'all 100ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
          >
            <span className={STATUS_DOT[client.status]} />
            <span style={{ fontSize: '12px', color: STATUS_COLOR[client.status], fontWeight: 500 }}>
              {CLIENT_STATUS_LABELS[client.status]}
            </span>
          </button>
          {statusOpen && (
            <StatusDropdown
              current={client.status}
              onSelect={s => { onStatusChange(client.id, s); setStatusOpen(false) }}
              onClose={() => setStatusOpen(false)}
            />
          )}
        </div>
      </td>

      {/* Retainer */}
      <td style={{ padding: '14px 20px' }}>
        <span className="num" style={{
          fontSize: '13px', fontWeight: 600,
          color: client.retainer_amount ? 'var(--text)' : 'var(--text-faint)',
        }}>
          {client.retainer_amount ? `${formatCurrency(client.retainer_amount)}/mo` : '— TBD'}
        </span>
      </td>

      {/* Location */}
      <td style={{ padding: '14px 20px' }}>
        {client.location ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={11} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{client.location}</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
        )}
      </td>

      {/* Services */}
      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(client.services ?? []).slice(0, 3).map(s => (
            <span key={s} style={{
              fontSize: '10px', fontWeight: 500, padding: '2px 6px',
              borderRadius: '4px', background: 'var(--surface-2)',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
            }}>
              {SERVICE_LABELS[s] ?? s}
            </span>
          ))}
          {(client.services ?? []).length === 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>—</span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              style={{
                padding: '5px 8px', borderRadius: '6px', fontSize: '12px',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <Phone size={11} />
            </a>
          )}
          <Link
            href={`/clients/${client.id}`}
            style={{
              padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'all 100ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)' }}
          >
            View <ChevronRight size={11} />
          </Link>
        </div>
      </td>
    </tr>
  )
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

function KanbanView({ clients, onStatusChange }: { clients: Client[]; onStatusChange: (id: string, status: ClientStatus) => void }) {
  const columns = PIPELINE_STATUSES

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
      gap: '12px',
      padding: '20px 28px',
      height: '100%',
      boxSizing: 'border-box',
      minWidth: '900px',
    }}>
      {columns.map(status => {
        const colClients = clients.filter(c => c.status === status)
        const nextStatus = columns[columns.indexOf(status) + 1]
        const prevStatus = columns[columns.indexOf(status) - 1]

        return (
          <div
            key={status}
            style={{
              display: 'flex', flexDirection: 'column', gap: '8px',
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Column header */}
            <div style={{
              padding: '12px 14px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {CLIENT_STATUS_LABELS[status]}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 700,
                background: colClients.length > 0 ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--surface-3)',
                color: colClients.length > 0 ? 'var(--accent)' : 'var(--text-faint)',
                padding: '1px 7px', borderRadius: '20px',
              }}>
                {colClients.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {colClients.length === 0 && (
                <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Empty</p>
                </div>
              )}
              {colClients.map(client => (
                <KanbanCard
                  key={client.id}
                  client={client}
                  nextStatus={nextStatus}
                  prevStatus={prevStatus}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({ client, nextStatus, prevStatus, onStatusChange }: {
  client: Client
  nextStatus?: ClientStatus
  prevStatus?: ClientStatus
  onStatusChange: (id: string, status: ClientStatus) => void
}) {
  return (
    <div
      style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '12px',
        transition: 'border-color 100ms ease, background 100ms ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Link
          href={`/clients/${client.id}`}
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', lineHeight: 1.3 }}
        >
          {client.name}
        </Link>
        <span className={DIV_CLASSES[client.division]} style={{ fontSize: '9px', flexShrink: 0, marginLeft: '6px' }}>
          {DIVISION_LABELS[client.division]}
        </span>
      </div>

      {client.owner_name && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{client.owner_name}</p>
      )}

      {client.retainer_amount && (
        <p className="num" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
          {formatCurrency(client.retainer_amount)}<span style={{ fontWeight: 400, color: 'var(--text-faint)', fontSize: '10px' }}>/mo</span>
        </p>
      )}

      {client.location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
          <MapPin size={10} style={{ color: 'var(--text-faint)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{client.location}</span>
        </div>
      )}

      {/* Move buttons */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {prevStatus && (
          <button
            onClick={() => onStatusChange(client.id, prevStatus)}
            style={{
              flex: 1, padding: '4px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: 500,
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            ← {CLIENT_STATUS_LABELS[prevStatus]}
          </button>
        )}
        {nextStatus && (
          <button
            onClick={() => onStatusChange(client.id, nextStatus)}
            style={{
              flex: 1, padding: '4px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: 500,
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              color: 'var(--accent)', cursor: 'pointer',
            }}
          >
            {CLIENT_STATUS_LABELS[nextStatus]} →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ current, onSelect, onClose }: {
  current: ClientStatus
  onSelect: (s: ClientStatus) => void
  onClose: () => void
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={onClose} />
      <div style={{
        position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 20,
        background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
        borderRadius: '10px', boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden', minWidth: '150px',
      }}>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            style={{
              width: '100%', padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: '8px',
              border: 'none', background: s === current ? 'var(--surface-3)' : 'transparent',
              cursor: 'pointer', textAlign: 'left',
              transition: 'background 80ms ease',
            }}
            onMouseEnter={e => { if (s !== current) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)' }}
            onMouseLeave={e => { if (s !== current) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <span className={STATUS_DOT[s]} />
            <span style={{ fontSize: '12px', color: STATUS_COLOR[s], fontWeight: 500 }}>
              {CLIENT_STATUS_LABELS[s]}
            </span>
            {s === current && <ArrowRight size={10} style={{ marginLeft: 'auto', color: 'var(--text-faint)' }} />}
          </button>
        ))}
      </div>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-faint)', letterSpacing: '0.04em' }}>{label}</span>
      <span className="num" style={{ fontSize: '12px', fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>
        {value}
      </span>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
        border: '1px solid', cursor: 'pointer', transition: 'all 80ms ease',
        background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface-1)',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        borderColor: active ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)',
      }}
    >
      {children}
    </button>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-faint)' }}>{message}</p>
    </div>
  )
}
