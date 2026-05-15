import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client, Division, ClientStatus } from '@/lib/supabase/types'
import { DIVISION_LABELS, DIVISION_FULL_LABELS } from '@/lib/constants'

const SERVICES = [
  { key: 'meta_ads', label: 'Meta Ads' },
  { key: 'google_ads', label: 'Google Ads' },
  { key: 'seo', label: 'SEO' },
  { key: 'brand_kit', label: 'Brand Kit' },
]
const STATUS_OPTIONS: ClientStatus[] = ['prospect', 'lead', 'proposal', 'onboarding', 'active', 'paused', 'churned']

interface Props { onClose: () => void; onAdded: (client: Client) => void }

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.03em' }}>{children}</p>
}
function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
}
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' }}>{children}</select>
}

export function AddClientModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({ name: '', owner_name: '', division: 'div1' as Division, status: 'prospect' as ClientStatus, retainer_amount: '', phone: '', email: '', website: '', location: '', services: [] as string[], notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleService(key: string) {
    setForm(f => ({ ...f, services: f.services.includes(key) ? f.services.filter(s => s !== key) : [...f.services, key] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Client name is required.'); return }
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.from('clients').insert({
        name: form.name.trim(), owner_name: form.owner_name.trim() || null, division: form.division, status: form.status,
        retainer_amount: form.retainer_amount ? Number(form.retainer_amount) : null,
        phone: form.phone.trim() || null, email: form.email.trim() || null, website: form.website.trim() || null,
        location: form.location.trim() || null, services: form.services.length ? form.services : [], notes: form.notes.trim() || null,
      }).select().single()
      if (err) throw err
      onAdded(data as Client)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create client.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>New Client</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Add a client to your pipeline</p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1/-1' }}><Label>Client Name *</Label><Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Polish & Shine Exteriors" /></div>
            <div><Label>Owner Name</Label><Input value={form.owner_name} onChange={v => setForm(f => ({ ...f, owner_name: v }))} placeholder="e.g. Dom" /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="City, State" /></div>
            <div><Label>Division</Label><Select value={form.division} onChange={v => setForm(f => ({ ...f, division: v as Division }))}>
              {(['div1', 'div2', 'div3'] as Division[]).map(d => <option key={d} value={d}>{DIVISION_LABELS[d]} — {DIVISION_FULL_LABELS[d]}</option>)}
            </Select></div>
            <div><Label>Status</Label><Select value={form.status} onChange={v => setForm(f => ({ ...f, status: v as ClientStatus }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </Select></div>
            <div><Label>Monthly Retainer ($)</Label><Input value={form.retainer_amount} onChange={v => setForm(f => ({ ...f, retainer_amount: v }))} placeholder="e.g. 7500" type="number" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="owner@business.com" type="email" /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} placeholder="https://..." /></div>
            <div style={{ gridColumn: '1/-1' }}>
              <Label>Services</Label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {SERVICES.map(s => {
                  const on = form.services.includes(s.key)
                  return <button key={s.key} type="button" onClick={() => toggleService(s.key)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 100ms ease', background: on ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface-2)', color: on ? 'var(--accent)' : 'var(--text-muted)', borderColor: on ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border)' }}>{s.label}</button>
                })}
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any context about this client..." rows={3} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: '1.5', boxSizing: 'border-box' }} />
            </div>
          </div>
          {error && <p style={{ color: 'var(--urgent)', fontSize: '12px', marginTop: '12px' }}>{error}</p>}
        </form>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'var(--accent)', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding...' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  )
}
