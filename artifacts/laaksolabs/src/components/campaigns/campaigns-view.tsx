import { useState } from 'react'
import { Megaphone, Plus, Zap, WifiOff, ExternalLink, DollarSign, Users, TrendingDown, BarChart2, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Campaign, CampaignPlatform, CampaignStatus, Client, Division } from '@/lib/supabase/types'
import { DIVISION_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

type CampaignWithClient = Campaign & { clients: { name: string; division: Division } | null }
const STATUS_COLORS: Record<CampaignStatus, string> = { draft: '#6B7280', active: '#22C55E', paused: '#EAB308', completed: '#3B82F6' }
const PLATFORM_COLORS: Record<CampaignPlatform, string> = { meta: '#1877F2', google: '#EA4335', other: '#6B7280' }
const MCP_ENDPOINTS = { meta: { label: 'Meta Ads MCP', url: 'mcp.facebook.com/ads', description: 'Programmatic Meta Ads management via MCP protocol' }, google: { label: 'Google Ads MCP', url: 'mcp.google.com/ads', description: 'Google Ads sync via MCP — coming soon' } }
const INPUT: React.CSSProperties = { padding: '7px 10px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%' }

function AddCampaignModal({ clients, onClose, onAdd }: { clients: Pick<Client, 'id' | 'name' | 'division'>[]; onClose: () => void; onAdd: (d: Omit<Campaign, 'id' | 'last_synced'> & { client_id: string }) => void }) {
  const [form, setForm] = useState({ client_id: clients[0]?.id ?? '', platform: 'meta' as CampaignPlatform, campaign_name: '', status: 'draft' as CampaignStatus, daily_budget: '', spend_mtd: '', leads_mtd: '', cost_per_lead: '', ctr: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function submit() {
    if (!form.campaign_name.trim() || !form.client_id) return
    setSaving(true)
    await onAdd({ client_id: form.client_id, platform: form.platform, campaign_name: form.campaign_name.trim(), status: form.status, daily_budget: form.daily_budget ? Number(form.daily_budget) : null, spend_mtd: form.spend_mtd ? Number(form.spend_mtd) : null, leads_mtd: form.leads_mtd ? Number(form.leads_mtd) : null, cost_per_lead: form.cost_per_lead ? Number(form.cost_per_lead) : null, ctr: form.ctr ? Number(form.ctr) / 100 : null, notes: form.notes.trim() || null } as Omit<Campaign, 'id' | 'last_synced'> & { client_id: string })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: '500px', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>New Campaign</p>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={12} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select value={form.client_id} onChange={e => f('client_id', e.target.value)} style={INPUT}><option value="">Select client *</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input value={form.campaign_name} onChange={e => f('campaign_name', e.target.value)} placeholder="Campaign name *" style={INPUT} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <select value={form.platform} onChange={e => f('platform', e.target.value)} style={INPUT}>{['meta', 'google', 'other'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}</select>
            <select value={form.status} onChange={e => f('status', e.target.value)} style={INPUT}>{['draft', 'active', 'paused', 'completed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input value={form.daily_budget} onChange={e => f('daily_budget', e.target.value)} placeholder="Daily Budget ($)" type="number" style={INPUT} />
            <input value={form.spend_mtd} onChange={e => f('spend_mtd', e.target.value)} placeholder="Spend MTD ($)" type="number" style={INPUT} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <input value={form.leads_mtd} onChange={e => f('leads_mtd', e.target.value)} placeholder="Leads MTD" type="number" style={INPUT} />
            <input value={form.cost_per_lead} onChange={e => f('cost_per_lead', e.target.value)} placeholder="CPL ($)" type="number" style={INPUT} />
            <input value={form.ctr} onChange={e => f('ctr', e.target.value)} placeholder="CTR (%)" type="number" step="0.01" style={INPUT} />
          </div>
          <input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Notes..." style={INPUT} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={!form.campaign_name.trim() || !form.client_id || saving} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: !form.campaign_name.trim() || !form.client_id || saving ? 0.6 : 1 }}>
              <Save size={12} /> {saving ? 'Adding...' : 'Add Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CampaignsView({ initialCampaigns, clients }: { initialCampaigns: CampaignWithClient[]; clients: Pick<Client, 'id' | 'name' | 'division'>[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [platform, setPlatform] = useState<CampaignPlatform | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = platform === 'all' ? campaigns : campaigns.filter(c => c.platform === platform)
  const stats = { spend: campaigns.reduce((s, c) => s + (c.spend_mtd ?? 0), 0), leads: campaigns.reduce((s, c) => s + (c.leads_mtd ?? 0), 0), active: campaigns.filter(c => c.status === 'active').length, cpl: (() => { const w = campaigns.filter(c => c.cost_per_lead != null); return w.length ? w.reduce((s, c) => s + (c.cost_per_lead ?? 0), 0) / w.length : 0 })() }

  async function handleAdd(data: Omit<Campaign, 'id' | 'last_synced'> & { client_id: string }) {
    const { data: row, error } = await createClient().from('campaigns').insert(data).select('*, clients(name, division)').single()
    if (!error && row) setCampaigns(prev => [row as unknown as CampaignWithClient, ...prev])
    setShowAdd(false)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}><Megaphone size={18} style={{ color: 'var(--accent)' }} /><h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Campaigns</h1></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Meta & Google ad performance — sync via MCP when connected</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}><Plus size={13} /> Add Campaign</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        {(['meta', 'google'] as const).map(key => {
          const ep = MCP_ENDPOINTS[key]
          return (
            <div key={key} style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><WifiOff size={15} style={{ color: 'var(--text-faint)' }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{ep.label}</p>
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '20px', background: 'var(--surface-2)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>Not Connected</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{ep.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}><code style={{ fontSize: '10px', color: 'var(--text-faint)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: '4px' }}>{ep.url}</code><ExternalLink size={10} style={{ color: 'var(--text-faint)' }} /></div>
              </div>
              <button style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Connect</button>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[{ icon: <DollarSign size={13} />, label: 'Spend MTD', value: formatCurrency(stats.spend), sub: 'across all platforms' }, { icon: <Users size={13} />, label: 'Leads MTD', value: String(stats.leads), sub: 'total generated' }, { icon: <TrendingDown size={13} />, label: 'Avg CPL', value: stats.cpl ? formatCurrency(stats.cpl) : '—', sub: 'cost per lead' }, { icon: <BarChart2 size={13} />, label: 'Active', value: String(stats.active), sub: 'running campaigns' }].map(({ icon, label, value, sub }) => (
          <div key={label} style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--text-muted)' }}>{icon}<span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span></div>
            <p className="num" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 2px', letterSpacing: '-0.03em' }}>{value}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(['all', 'meta', 'google', 'other'] as const).map(p => (
          <button key={p} onClick={() => setPlatform(p)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1px solid', cursor: 'pointer', background: platform === p ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface-2)', color: platform === p ? 'var(--accent)' : 'var(--text-muted)', borderColor: platform === p ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border)' }}>
            {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="card table-scroll-wrap" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Megaphone size={28} style={{ color: 'var(--text-faint)', marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>No campaigns yet</p>
            <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Add campaigns manually or connect Meta MCP to sync automatically</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Client', 'Campaign', 'Platform', 'Status', 'Budget/Day', 'Spend MTD', 'Leads', 'CPL', 'CTR', 'Last Synced'].map(h => <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}><p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>{c.clients?.name ?? '—'}</p>{c.clients && <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '2px 0 0' }}>{DIVISION_LABELS[c.clients.division]}</p>}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.campaign_name}</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: `${PLATFORM_COLORS[c.platform]}18`, color: PLATFORM_COLORS[c.platform], border: `1px solid ${PLATFORM_COLORS[c.platform]}35` }}>{c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: `${STATUS_COLORS[c.status]}18`, color: STATUS_COLORS[c.status], border: `1px solid ${STATUS_COLORS[c.status]}35` }}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span></td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.daily_budget != null ? formatCurrency(c.daily_budget) : '—'}</td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.spend_mtd != null ? formatCurrency(c.spend_mtd) : '—'}</td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.leads_mtd ?? '—'}</td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.cost_per_lead != null ? formatCurrency(c.cost_per_lead) : '—'}</td>
                  <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.ctr != null ? `${(c.ctr * 100).toFixed(2)}%` : '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-faint)' }}>{c.last_synced ? new Date(c.last_synced).toLocaleDateString() : 'Manual'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddCampaignModal clients={clients} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
