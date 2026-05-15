import { useState, useEffect } from 'react'
import { Megaphone, Plus, CheckCircle, WifiOff, RefreshCw, DollarSign, Users, TrendingDown, BarChart2, X, Save, AlertCircle, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Campaign, CampaignPlatform, CampaignStatus, Client, Division } from '@/lib/supabase/types'
import { DIVISION_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { exportToCsv } from '@/lib/export-csv'

type CampaignWithClient = Campaign & { clients: { name: string; division: Division } | null }

interface NormalizedCampaign {
  platform_id: string
  platform: 'meta' | 'google'
  campaign_name: string
  status: CampaignStatus
  daily_budget: number | null
  spend_mtd: number | null
  leads_mtd: number | null
  cost_per_lead: number | null
  ctr: number | null
  last_synced: string
}

interface ConnectionStatus {
  meta: { connected: boolean; hint: string | null }
  google: { connected: boolean; hint: string | null }
}

interface SyncState {
  status: 'idle' | 'syncing' | 'success' | 'error'
  message?: string
  updatedCount?: number
  newCampaigns?: NormalizedCampaign[]
}

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: '#6B7280', active: '#22C55E', paused: '#EAB308', completed: '#3B82F6',
}
const PLATFORM_COLORS: Record<CampaignPlatform, string> = {
  meta: '#1877F2', google: '#EA4335', other: '#6B7280',
}
const INPUT: React.CSSProperties = {
  padding: '7px 10px', fontSize: '12px', background: 'var(--surface-2)',
  border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%',
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

// ─── Add Campaign Modal ────────────────────────────────────────────────────────

function AddCampaignModal({ clients, onClose, onAdd }: {
  clients: Pick<Client, 'id' | 'name' | 'division'>[]
  onClose: () => void
  onAdd: (d: Omit<Campaign, 'id' | 'last_synced'> & { client_id: string }) => Promise<void>
}) {
  const [form, setForm] = useState({
    client_id: clients[0]?.id ?? '', platform: 'meta' as CampaignPlatform,
    campaign_name: '', status: 'draft' as CampaignStatus,
    daily_budget: '', spend_mtd: '', leads_mtd: '', cost_per_lead: '', ctr: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function submit() {
    if (!form.campaign_name.trim() || !form.client_id) return
    setSaving(true)
    await onAdd({
      client_id: form.client_id, platform: form.platform,
      campaign_name: form.campaign_name.trim(), status: form.status,
      daily_budget: form.daily_budget ? Number(form.daily_budget) : null,
      spend_mtd: form.spend_mtd ? Number(form.spend_mtd) : null,
      leads_mtd: form.leads_mtd ? Number(form.leads_mtd) : null,
      cost_per_lead: form.cost_per_lead ? Number(form.cost_per_lead) : null,
      ctr: form.ctr ? Number(form.ctr) / 100 : null,
      notes: form.notes.trim() || null,
    } as Omit<Campaign, 'id' | 'last_synced'> & { client_id: string })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: '500px', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>New Campaign</p>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select value={form.client_id} onChange={e => f('client_id', e.target.value)} style={INPUT}>
            <option value="">Select client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={form.campaign_name} onChange={e => f('campaign_name', e.target.value)} placeholder="Campaign name *" style={INPUT} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <select value={form.platform} onChange={e => f('platform', e.target.value)} style={INPUT}>
              {['meta', 'google', 'other'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <select value={form.status} onChange={e => f('status', e.target.value)} style={INPUT}>
              {['draft', 'active', 'paused', 'completed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
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
            <button onClick={submit} disabled={!form.campaign_name.trim() || !form.client_id || saving}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: !form.campaign_name.trim() || !form.client_id || saving ? 0.6 : 1 }}>
              <Save size={12} /> {saving ? 'Adding...' : 'Add Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Import New Campaigns Modal ────────────────────────────────────────────────

function ImportModal({ newCampaigns, clients, onClose, onImport }: {
  newCampaigns: NormalizedCampaign[]
  clients: Pick<Client, 'id' | 'name' | 'division'>[]
  onClose: () => void
  onImport: (items: Array<NormalizedCampaign & { client_id: string }>) => Promise<void>
}) {
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(newCampaigns.map(c => [c.platform_id, clients[0]?.id ?? '']))
  )
  const [selected, setSelected] = useState<Set<string>>(new Set(newCampaigns.map(c => c.platform_id)))
  const [importing, setImporting] = useState(false)

  async function handleImport() {
    const items = newCampaigns
      .filter(c => selected.has(c.platform_id) && assignments[c.platform_id])
      .map(c => ({ ...c, client_id: assignments[c.platform_id] }))
    if (!items.length) return
    setImporting(true)
    await onImport(items)
    setImporting(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: '680px', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', padding: '24px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>New Campaigns Found</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>Assign each campaign to a client before importing</p>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', margin: '16px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Campaign', 'Platform', 'Budget/Day', 'Assign to Client'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {newCampaigns.map(c => (
                <tr key={c.platform_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px' }}>
                    <input type="checkbox" checked={selected.has(c.platform_id)}
                      onChange={e => setSelected(prev => { const s = new Set(prev); e.target.checked ? s.add(c.platform_id) : s.delete(c.platform_id); return s })}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{c.campaign_name}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: `${PLATFORM_COLORS[c.platform as CampaignPlatform] ?? '#6B7280'}18`, color: PLATFORM_COLORS[c.platform as CampaignPlatform] ?? '#6B7280', border: `1px solid ${PLATFORM_COLORS[c.platform as CampaignPlatform] ?? '#6B7280'}35` }}>
                      {c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {c.daily_budget ? formatCurrency(c.daily_budget) : '—'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <select value={assignments[c.platform_id] ?? ''} onChange={e => setAssignments(p => ({ ...p, [c.platform_id]: e.target.value }))}
                      style={{ ...INPUT, width: '180px' }}>
                      <option value="">Select client</option>
                      {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.size} of {newCampaigns.length} selected</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Skip</button>
            <button onClick={handleImport} disabled={selected.size === 0 || importing}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: selected.size === 0 || importing ? 0.6 : 1 }}>
              <Save size={12} /> {importing ? 'Importing...' : `Import ${selected.size}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Connection Card ───────────────────────────────────────────────────────────

function ConnectionCard({ platform, label, description, color, connected, hint, syncState, onSync }: {
  platform: 'meta' | 'google'
  label: string
  description: string
  color: string
  connected: boolean
  hint: string | null
  syncState: SyncState
  onSync: () => void
}) {
  const syncing = syncState.status === 'syncing'
  const success = syncState.status === 'success'
  const error = syncState.status === 'error'

  return (
    <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-1)', border: `1px solid ${connected ? `${color}30` : 'var(--border)'}`, display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: connected ? `${color}15` : 'var(--surface-2)', border: `1px solid ${connected ? `${color}30` : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {connected
          ? <CheckCircle size={16} style={{ color }} />
          : <WifiOff size={15} style={{ color: 'var(--text-faint)' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{label}</p>
          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '20px', background: connected ? `${color}15` : 'var(--surface-2)', color: connected ? color : 'var(--text-faint)', border: `1px solid ${connected ? `${color}30` : 'var(--border)'}` }}>
            {connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
        {!connected && hint && (
          <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required secrets</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {hint.replace('Set ', '').replace(' secrets', '').split(', ').map(s => (
                <code key={s} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--surface-1)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>{s}</code>
              ))}
            </div>
          </div>
        )}
        {(success || error) && (
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {success
              ? <><CheckCircle size={11} style={{ color: 'var(--active)' }} /><span style={{ fontSize: '11px', color: 'var(--active)' }}>{syncState.message}</span></>
              : <><AlertCircle size={11} style={{ color: 'var(--urgent)' }} /><span style={{ fontSize: '11px', color: 'var(--urgent)' }}>{syncState.message}</span></>}
          </div>
        )}
      </div>
      {connected && (
        <button onClick={onSync} disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid', cursor: syncing ? 'default' : 'pointer', background: `${color}12`, color, borderColor: `${color}35`, whiteSpace: 'nowrap', opacity: syncing ? 0.6 : 1, flexShrink: 0 }}>
          <RefreshCw size={11} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function CampaignsView({ initialCampaigns, clients }: {
  initialCampaigns: CampaignWithClient[]
  clients: Pick<Client, 'id' | 'name' | 'division'>[]
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [platform, setPlatform] = useState<CampaignPlatform | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [connections, setConnections] = useState<ConnectionStatus | null>(null)
  const [metaSync, setMetaSync] = useState<SyncState>({ status: 'idle' })
  const [googleSync, setGoogleSync] = useState<SyncState>({ status: 'idle' })
  const [importQueue, setImportQueue] = useState<NormalizedCampaign[]>([])

  const filtered = platform === 'all' ? campaigns : campaigns.filter(c => c.platform === platform)
  const stats = {
    spend: campaigns.reduce((s, c) => s + (c.spend_mtd ?? 0), 0),
    leads: campaigns.reduce((s, c) => s + (c.leads_mtd ?? 0), 0),
    active: campaigns.filter(c => c.status === 'active').length,
    cpl: (() => { const w = campaigns.filter(c => c.cost_per_lead != null); return w.length ? w.reduce((s, c) => s + (c.cost_per_lead ?? 0), 0) / w.length : 0 })(),
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/campaigns/connections`, { credentials: 'include' })
      .then(r => r.json())
      .then((d: ConnectionStatus) => setConnections(d))
      .catch(() => {})
  }, [])

  async function syncPlatform(plat: 'meta' | 'google') {
    const setState = plat === 'meta' ? setMetaSync : setGoogleSync
    setState({ status: 'syncing' })

    try {
      const res = await fetch(`${API_BASE}/api/campaigns/sync/${plat}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json() as { campaigns?: NormalizedCampaign[]; error?: string }

      if (!res.ok || data.error) {
        setState({ status: 'error', message: data.error ?? 'Sync failed' })
        return
      }

      const synced = data.campaigns ?? []

      // Match synced campaigns to existing ones by platform + name
      const sb = createClient()
      let updatedCount = 0
      const newOnes: NormalizedCampaign[] = []

      for (const s of synced) {
        const existing = campaigns.find(
          c => c.platform === s.platform &&
            c.campaign_name.toLowerCase() === s.campaign_name.toLowerCase()
        )

        if (existing) {
          // Update stats on the matched campaign
          await sb.from('campaigns').update({
            status: s.status,
            daily_budget: s.daily_budget,
            spend_mtd: s.spend_mtd,
            leads_mtd: s.leads_mtd,
            cost_per_lead: s.cost_per_lead,
            ctr: s.ctr,
            last_synced: s.last_synced,
          }).eq('id', existing.id)

          setCampaigns(prev => prev.map(c =>
            c.id === existing.id
              ? { ...c, status: s.status, daily_budget: s.daily_budget, spend_mtd: s.spend_mtd, leads_mtd: s.leads_mtd, cost_per_lead: s.cost_per_lead, ctr: s.ctr, last_synced: s.last_synced }
              : c
          ))
          updatedCount++
        } else {
          newOnes.push(s)
        }
      }

      if (newOnes.length > 0) {
        setImportQueue(newOnes)
        setState({ status: 'success', message: `${updatedCount} updated · ${newOnes.length} new found`, updatedCount })
      } else {
        setState({ status: 'success', message: `${updatedCount} campaign${updatedCount !== 1 ? 's' : ''} updated`, updatedCount })
        setTimeout(() => setState({ status: 'idle' }), 5000)
      }
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Network error' })
    }
  }

  async function handleImport(items: Array<NormalizedCampaign & { client_id: string }>) {
    const sb = createClient()
    const inserted: CampaignWithClient[] = []

    for (const item of items) {
      const { data, error } = await sb.from('campaigns').insert({
        client_id: item.client_id,
        platform: item.platform,
        campaign_name: item.campaign_name,
        status: item.status,
        daily_budget: item.daily_budget,
        spend_mtd: item.spend_mtd,
        leads_mtd: item.leads_mtd,
        cost_per_lead: item.cost_per_lead,
        ctr: item.ctr,
        last_synced: item.last_synced,
      }).select('*, clients(name, division)').single()

      if (!error && data) inserted.push(data as unknown as CampaignWithClient)
    }

    if (inserted.length) setCampaigns(prev => [...inserted, ...prev])
    setImportQueue([])
  }

  async function handleAddManual(data: Omit<Campaign, 'id' | 'last_synced'> & { client_id: string }) {
    const { data: row, error } = await createClient().from('campaigns').insert(data).select('*, clients(name, division)').single()
    if (!error && row) setCampaigns(prev => [row as unknown as CampaignWithClient, ...prev])
    setShowAdd(false)
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 32px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Megaphone size={18} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Campaigns</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Meta & Google ad performance — sync live from your ad accounts</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => exportToCsv(`campaigns-${new Date().toISOString().slice(0, 10)}.csv`, campaigns.map(c => ({ Client: c.clients?.name ?? '', Campaign: c.campaign_name, Platform: c.platform, Status: c.status, 'Budget/Day': c.daily_budget ?? '', 'Spend MTD': c.spend_mtd ?? '', Leads: c.leads_mtd ?? '', CPL: c.cost_per_lead ?? '', CTR: c.ctr != null ? `${(c.ctr * 100).toFixed(2)}%` : '' })))}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
            <Download size={13} /> CSV
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} /> Add Campaign
          </button>
        </div>
      </div>

      {/* Connection cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <ConnectionCard
          platform="meta" label="Meta Ads" color="#1877F2"
          description="Sync campaigns, spend, leads, and CTR from your Meta Ad Account"
          connected={connections?.meta.connected ?? false}
          hint={connections?.meta.hint ?? null}
          syncState={metaSync}
          onSync={() => syncPlatform('meta')}
        />
        <ConnectionCard
          platform="google" label="Google Ads" color="#EA4335"
          description="Pull campaign performance from Google Ads via OAuth refresh token"
          connected={connections?.google.connected ?? false}
          hint={connections?.google.hint ?? null}
          syncState={googleSync}
          onSync={() => syncPlatform('google')}
        />
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: <DollarSign size={13} />, label: 'Spend MTD', value: formatCurrency(stats.spend), sub: 'across all platforms' },
          { icon: <Users size={13} />, label: 'Leads MTD', value: String(stats.leads), sub: 'total generated' },
          { icon: <TrendingDown size={13} />, label: 'Avg CPL', value: stats.cpl ? formatCurrency(stats.cpl) : '—', sub: 'cost per lead' },
          { icon: <BarChart2 size={13} />, label: 'Active', value: String(stats.active), sub: 'running campaigns' },
        ].map(({ icon, label, value, sub }) => (
          <div key={label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--text-muted)' }}>{icon}<span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span></div>
            <p className="num" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px', letterSpacing: '-0.03em' }}>{value}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Platform filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(['all', 'meta', 'google', 'other'] as const).map(p => (
          <button key={p} onClick={() => setPlatform(p)}
            style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, border: '1px solid', cursor: 'pointer', background: platform === p ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface-2)', color: platform === p ? 'var(--accent)' : 'var(--text-muted)', borderColor: platform === p ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border)' }}>
            {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Megaphone size={28} style={{ color: 'var(--text-faint)', marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>No campaigns yet</p>
            <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Add campaigns manually or sync from Meta/Google once connected</p>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                  {['Client', 'Campaign', 'Platform', 'Status', 'Budget/Day', 'Spend MTD', 'Leads', 'CPL', 'CTR', 'Last Synced'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--surface-1)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>{c.clients?.name ?? '—'}</p>
                      {c.clients && <p style={{ fontSize: '10px', color: 'var(--text-faint)', margin: '2px 0 0' }}>{DIVISION_LABELS[c.clients.division]}</p>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.campaign_name}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: `${PLATFORM_COLORS[c.platform]}18`, color: PLATFORM_COLORS[c.platform], border: `1px solid ${PLATFORM_COLORS[c.platform]}35` }}>
                        {c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: `${STATUS_COLORS[c.status]}18`, color: STATUS_COLORS[c.status], border: `1px solid ${STATUS_COLORS[c.status]}35` }}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.daily_budget != null ? formatCurrency(c.daily_budget) : '—'}</td>
                    <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{c.spend_mtd != null ? formatCurrency(c.spend_mtd) : '—'}</td>
                    <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.leads_mtd ?? '—'}</td>
                    <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.cost_per_lead != null ? formatCurrency(c.cost_per_lead) : '—'}</td>
                    <td className="num" style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text)' }}>{c.ctr != null ? `${(c.ctr * 100).toFixed(2)}%` : '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: c.last_synced ? 'var(--text-faint)' : 'var(--text-faint)' }}>
                      {c.last_synced ? new Date(c.last_synced).toLocaleDateString() : <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Manual</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddCampaignModal clients={clients} onClose={() => setShowAdd(false)} onAdd={handleAddManual} />}
      {importQueue.length > 0 && (
        <ImportModal
          newCampaigns={importQueue}
          clients={clients}
          onClose={() => setImportQueue([])}
          onImport={handleImport}
        />
      )}
    </div>
  )
}
