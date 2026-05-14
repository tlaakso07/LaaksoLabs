'use client'

import { useState } from 'react'
import {
  Megaphone, Plus, Zap, WifiOff, ExternalLink,
  DollarSign, Users, TrendingDown, BarChart2, X, Save,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Campaign, CampaignPlatform, CampaignStatus, Client, Division } from '@/lib/supabase/types'
import { DIVISION_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

type CampaignWithClient = Campaign & { clients: { name: string; division: Division } | null }

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft:     '#6B7280',
  active:    '#22C55E',
  paused:    '#EAB308',
  completed: '#3B82F6',
}

const PLATFORM_COLORS: Record<CampaignPlatform, string> = {
  meta:   '#1877F2',
  google: '#EA4335',
  other:  '#6B7280',
}

const MCP_ENDPOINTS: Record<'meta' | 'google', { label: string; url: string; description: string }> = {
  meta:   { label: 'Meta Ads MCP',   url: 'mcp.facebook.com/ads', description: 'Programmatic Meta Ads management via MCP protocol' },
  google: { label: 'Google Ads MCP', url: 'mcp.google.com/ads',   description: 'Google Ads sync via MCP — coming soon' },
}

interface Props {
  initialCampaigns: CampaignWithClient[]
  clients: Pick<Client, 'id' | 'name' | 'division'>[]
}

export function CampaignsView({ initialCampaigns, clients }: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [platform, setPlatform]   = useState<CampaignPlatform | 'all'>('all')
  const [showAdd, setShowAdd]     = useState(false)

  const filtered = platform === 'all' ? campaigns : campaigns.filter(c => c.platform === platform)

  const stats = {
    spend:  campaigns.reduce((s, c) => s + (c.spend_mtd ?? 0), 0),
    leads:  campaigns.reduce((s, c) => s + (c.leads_mtd ?? 0), 0),
    active: campaigns.filter(c => c.status === 'active').length,
    cpl:    (() => {
      const withCpl = campaigns.filter(c => c.cost_per_lead != null)
      return withCpl.length ? withCpl.reduce((s, c) => s + (c.cost_per_lead ?? 0), 0) / withCpl.length : 0
    })(),
  }

  async function handleAdd(data: Omit<Campaign, 'id' | 'last_synced'> & { client_id: string }) {
    const { data: row, error } = await createClient()
      .from('campaigns').insert(data).select('*, clients(name, division)').single()
    if (!error && row) setCampaigns(prev => [row as unknown as CampaignWithClient, ...prev])
    setShowAdd(false)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Megaphone size={18} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Campaigns</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
            Meta & Google ad performance — sync via MCP when connected
          </p>
        </div>
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
          Add Campaign
        </button>
      </div>

      {/* MCP Connection Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
        {(['meta', 'google'] as const).map(key => {
          const ep = MCP_ENDPOINTS[key]
          const connected = false
          return (
            <div key={key} style={{
              padding: '16px 20px', borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: connected ? `${PLATFORM_COLORS[key]}18` : 'var(--surface-2)',
                border: `1px solid ${connected ? PLATFORM_COLORS[key] + '40' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {connected
                  ? <Zap size={15} style={{ color: PLATFORM_COLORS[key] }} />
                  : <WifiOff size={15} style={{ color: 'var(--text-faint)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{ep.label}</p>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '2px 7px', borderRadius: 20,
                    background: connected ? '#22C55E22' : 'var(--surface-2)',
                    color: connected ? '#22C55E' : 'var(--text-faint)',
                    border: `1px solid ${connected ? '#22C55E40' : 'var(--border)'}`,
                  }}>
                    {connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{ep.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <code style={{ fontSize: 10, color: 'var(--text-faint)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4 }}>
                    {ep.url}
                  </code>
                  <ExternalLink size={10} style={{ color: 'var(--text-faint)' }} />
                </div>
              </div>
              <button style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: `1px solid ${connected ? 'var(--border)' : 'var(--accent)'}`,
                background: connected ? 'var(--surface-2)' : `color-mix(in srgb, var(--accent) 10%, transparent)`,
                color: connected ? 'var(--text-muted)' : 'var(--accent)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          )
        })}
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} className="kpi-grid">
        {[
          { icon: <DollarSign size={13} />, label: 'Spend MTD',    value: formatCurrency(stats.spend),  sub: 'across all platforms' },
          { icon: <Users size={13} />,      label: 'Leads MTD',     value: String(stats.leads),          sub: 'total generated' },
          { icon: <TrendingDown size={13} />,label: 'Avg CPL',      value: stats.cpl ? formatCurrency(stats.cpl) : '—', sub: 'cost per lead' },
          { icon: <BarChart2 size={13} />,  label: 'Active',        value: String(stats.active),         sub: 'running campaigns' },
        ].map(({ icon, label, value, sub }) => (
          <div key={label} style={{
            padding: '16px 20px', borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-1)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--text-muted)' }}>
              {icon}
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px', letterSpacing: '-0.03em' }} className="num">{value}</p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Platform filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all', 'meta', 'google', 'other'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: '1px solid', cursor: 'pointer',
              background: platform === p ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface-2)',
              color: platform === p ? 'var(--accent)' : 'var(--text-muted)',
              borderColor: platform === p ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border)',
            }}
          >
            {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaigns Table */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} className="table-scroll-wrap">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Megaphone size={28} style={{ color: 'var(--text-faint)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>No campaigns yet</p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Add campaigns manually or connect Meta MCP to sync automatically
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Client', 'Campaign', 'Platform', 'Status', 'Budget/Day', 'Spend MTD', 'Leads', 'CPL', 'CTR', 'Last Synced'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{c.clients?.name ?? '—'}</p>
                    {c.clients && <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: '2px 0 0' }}>{DIVISION_LABELS[c.clients.division]}</p>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text)' }}>{c.campaign_name}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: `${PLATFORM_COLORS[c.platform]}18`,
                      color: PLATFORM_COLORS[c.platform],
                      border: `1px solid ${PLATFORM_COLORS[c.platform]}35`,
                    }}>
                      {c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: `${STATUS_COLORS[c.status]}18`,
                      color: STATUS_COLORS[c.status],
                      border: `1px solid ${STATUS_COLORS[c.status]}35`,
                    }}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text)' }}>{c.daily_budget != null ? formatCurrency(c.daily_budget) : '—'}</td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text)' }}>{c.spend_mtd != null ? formatCurrency(c.spend_mtd) : '—'}</td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text)' }}>{c.leads_mtd ?? '—'}</td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text)' }}>{c.cost_per_lead != null ? formatCurrency(c.cost_per_lead) : '—'}</td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text)' }}>{c.ctr != null ? `${(c.ctr * 100).toFixed(2)}%` : '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-faint)' }}>
                    {c.last_synced ? new Date(c.last_synced).toLocaleDateString() : <span style={{ color: 'var(--text-faint)' }}>Manual</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Campaign Modal */}
      {showAdd && <AddCampaignModal clients={clients} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}

function AddCampaignModal({
  clients,
  onClose,
  onAdd,
}: {
  clients: Pick<Client, 'id' | 'name' | 'division'>[]
  onClose: () => void
  onAdd: (data: Omit<Campaign, 'id' | 'last_synced'> & { client_id: string }) => void
}) {
  const [form, setForm] = useState({
    client_id: clients[0]?.id ?? '',
    platform: 'meta' as CampaignPlatform,
    campaign_name: '',
    status: 'draft' as CampaignStatus,
    daily_budget: '',
    spend_mtd: '',
    leads_mtd: '',
    cost_per_lead: '',
    ctr: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  function f(k: string, v: string) { setForm(prev => ({ ...prev, [k]: v })) }

  async function submit() {
    if (!form.campaign_name.trim() || !form.client_id) return
    setSaving(true)
    await onAdd({
      client_id:    form.client_id,
      platform:     form.platform,
      campaign_name: form.campaign_name.trim(),
      status:       form.status,
      daily_budget: form.daily_budget ? Number(form.daily_budget) : null,
      spend_mtd:    form.spend_mtd    ? Number(form.spend_mtd)    : null,
      leads_mtd:    form.leads_mtd    ? Number(form.leads_mtd)    : null,
      cost_per_lead: form.cost_per_lead ? Number(form.cost_per_lead) : null,
      ctr:          form.ctr          ? Number(form.ctr) / 100    : null,
      notes:        form.notes.trim() || null,
    } as Omit<Campaign, 'id' | 'last_synced'> & { client_id: string })
    setSaving(false)
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div className="modal-sheet" style={{ width: '100%', maxWidth: 520, background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>New Campaign</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <FL>Campaign Name *</FL>
            <FI value={form.campaign_name} onChange={v => f('campaign_name', v)} placeholder="e.g. Windows — Federal Way Aug" />
          </div>
          <div>
            <FL>Client *</FL>
            <FS value={form.client_id} onChange={v => f('client_id', v)}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FS>
          </div>
          <div>
            <FL>Platform</FL>
            <FS value={form.platform} onChange={v => f('platform', v)}>
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="other">Other</option>
            </FS>
          </div>
          <div>
            <FL>Status</FL>
            <FS value={form.status} onChange={v => f('status', v)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </FS>
          </div>
          <div>
            <FL>Daily Budget ($)</FL>
            <FI value={form.daily_budget} onChange={v => f('daily_budget', v)} placeholder="e.g. 50" type="number" />
          </div>
          <div>
            <FL>Spend MTD ($)</FL>
            <FI value={form.spend_mtd} onChange={v => f('spend_mtd', v)} placeholder="e.g. 1200" type="number" />
          </div>
          <div>
            <FL>Leads MTD</FL>
            <FI value={form.leads_mtd} onChange={v => f('leads_mtd', v)} placeholder="e.g. 18" type="number" />
          </div>
          <div>
            <FL>CTR (%)</FL>
            <FI value={form.ctr} onChange={v => f('ctr', v)} placeholder="e.g. 2.4" type="number" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <FL>Notes</FL>
            <textarea
              value={form.notes}
              onChange={e => f('notes', e.target.value)}
              rows={2}
              placeholder="Any campaign context..."
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={submit}
            disabled={saving || !form.campaign_name.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--accent)', border: 'none', color: '#fff', cursor: saving || !form.campaign_name.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.campaign_name.trim() ? 0.6 : 1 }}
          >
            <Save size={13} />
            {saving ? 'Saving…' : 'Add Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FL({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.03em' }}>{children}</p>
}
function FI({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
}
function FS({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' }}>{children}</select>
}
