import { useState, useTransition, useMemo } from 'react'
import { Search, Plus, X, Trash2, Phone, Mail, ExternalLink, Pencil, Save } from 'lucide-react'
import { Link } from 'wouter'
import type { Contact, Client } from '@/lib/supabase/types'
import { createContact, deleteContact } from '@/lib/supabase/queries/contacts'
import { createClient as sbClient } from '@/lib/supabase/client'

type ClientRef = Pick<Client, 'id' | 'name' | 'division'>
export type ContactWithClient = Contact & { clients: { name: string } | null }

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
function classifyGroup(c: ContactWithClient): 'clients' | 'partners' | 'prospects' | 'other' {
  if (c.client_id) return 'clients'
  const role = (c.role ?? '').toLowerCase()
  if (role.includes('partner')) return 'partners'
  if (role.includes('prospect')) return 'prospects'
  return 'other'
}

const GROUP_LABELS = { clients: 'Clients', partners: 'Partners', prospects: 'Prospects', other: 'Other' } as const
const GROUP_ORDER: Array<keyof typeof GROUP_LABELS> = ['clients', 'partners', 'prospects', 'other']
const ROLE_SUGGESTIONS = ['Client Owner', 'White-Label Partner', 'Prospect', 'Vendor', 'Advisor', 'Contact']

const INPUT_STYLE: React.CSSProperties = { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '13px', padding: '7px 10px', outline: 'none', width: '100%', fontFamily: 'inherit', boxSizing: 'border-box' }

function ContactRow({ contact, clients, deleting, onDelete, onUpdate }: { contact: ContactWithClient; clients: ClientRef[]; deleting: string | null; onDelete: (id: string) => void; onUpdate: (u: ContactWithClient) => void }) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: contact.name, role: contact.role ?? '', company: contact.company ?? '', phone: contact.phone ?? '', email: contact.email ?? '', client_id: contact.client_id ?? '', notes: contact.notes ?? '' })
  const isDel = deleting === contact.id
  const linkedClient = clients.find(c => c.id === contact.client_id)
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    if (!form.name.trim() || saving) return
    setSaving(true)
    const { data, error } = await sbClient().from('contacts').update({ name: form.name.trim(), role: form.role.trim() || null, company: form.company.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, client_id: form.client_id || null, notes: form.notes.trim() || null }).eq('id', contact.id).select('*, clients(name)').single()
    setSaving(false)
    if (!error && data) { onUpdate(data as ContactWithClient); setEditing(false) }
  }

  if (editing) {
    return (
      <div style={{ padding: '16px', background: 'var(--surface-2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Full name *" style={INPUT_STYLE} />
          <input value={form.role} onChange={e => f('role', e.target.value)} placeholder="Role" style={INPUT_STYLE} list="role-suggestions" />
          <input value={form.company} onChange={e => f('company', e.target.value)} placeholder="Company" style={INPUT_STYLE} />
          <select value={form.client_id} onChange={e => f('client_id', e.target.value)} style={INPUT_STYLE}><option value="">No linked client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="Phone" style={INPUT_STYLE} type="tel" />
          <input value={form.email} onChange={e => f('email', e.target.value)} placeholder="Email" style={INPUT_STYLE} type="email" />
        </div>
        <textarea value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Notes" rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' as const, fontFamily: 'inherit', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving || !form.name.trim()} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '7px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: saving || !form.name.trim() ? 0.6 : 1 }}><Save size={12} />{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ opacity: isDel ? 0.35 : 1, transition: 'opacity 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: hovered ? 'var(--surface-2)' : 'transparent', transition: 'background 100ms ease' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{getInitials(contact.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{contact.name}</span>
            {linkedClient && (
              <Link href={`/clients/${linkedClient.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
              >{linkedClient.name}<ExternalLink size={9} /></Link>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{[contact.role, contact.company].filter(Boolean).join(' · ')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {contact.phone && <a href={`tel:${contact.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: hovered ? 'var(--surface-3)' : 'transparent', textDecoration: 'none', transition: 'all 100ms ease', whiteSpace: 'nowrap' }}><Phone size={12} />{contact.phone}</a>}
          {contact.email && <a href={`mailto:${contact.email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: hovered ? 'var(--surface-3)' : 'transparent', textDecoration: 'none', transition: 'all 100ms ease', whiteSpace: 'nowrap' }}><Mail size={12} />{contact.email}</a>}
          <button onClick={() => setEditing(true)} style={{ opacity: hovered ? 0.6 : 0, transition: 'opacity 150ms ease', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500 }}><Pencil size={11} /> Edit</button>
          <button onClick={() => onDelete(contact.id)} disabled={!!deleting} style={{ opacity: hovered ? 0.45 : 0, transition: 'opacity 150ms ease', padding: '4px', borderRadius: '4px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>
        </div>
      </div>
      {contact.notes && hovered && <div style={{ padding: '0 16px 10px 70px', fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic' }}>{contact.notes}</div>}
    </div>
  )
}

function AddContactForm({ clients, onAdd, onCancel }: { clients: ClientRef[]; onAdd: (c: ContactWithClient) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', role: '', company: '', phone: '', email: '', client_id: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      const newContact = await createContact({ name: form.name.trim(), role: form.role.trim() || null, company: form.company.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, client_id: form.client_id || null, notes: form.notes.trim() || null })
      const withClient: ContactWithClient = { ...newContact, clients: clients.find(c => c.id === newContact.client_id) ? { name: clients.find(c => c.id === newContact.client_id)!.name } : null }
      onAdd(withClient)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ padding: '20px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Full name *" style={INPUT_STYLE} />
          <input value={form.role} onChange={e => f('role', e.target.value)} placeholder="Role" style={INPUT_STYLE} list="role-suggestions" />
          <input value={form.company} onChange={e => f('company', e.target.value)} placeholder="Company" style={INPUT_STYLE} />
          <select value={form.client_id} onChange={e => f('client_id', e.target.value)} style={INPUT_STYLE}><option value="">No linked client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="Phone" style={INPUT_STYLE} type="tel" />
          <input value={form.email} onChange={e => f('email', e.target.value)} placeholder="Email" style={INPUT_STYLE} type="email" />
        </div>
        <textarea value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Notes" rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' as const, fontFamily: 'inherit', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={saving || !form.name.trim()} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '7px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: saving || !form.name.trim() ? 0.6 : 1 }}><Plus size={12} />{saving ? 'Adding…' : 'Add Contact'}</button>
        </div>
      </form>
      <datalist id="role-suggestions">{ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}</datalist>
    </div>
  )
}

export function ContactsView({ initialContacts, clients }: { initialContacts: ContactWithClient[]; clients: ClientRef[] }) {
  const [contacts, setContacts] = useState(initialContacts)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [, startTx] = useTransition()

  const filtered = useMemo(() => {
    if (!search) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c => c.name.toLowerCase().includes(q) || (c.role ?? '').toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q) || (c.clients?.name ?? '').toLowerCase().includes(q))
  }, [contacts, search])

  const grouped = useMemo(() => {
    const g = { clients: [] as ContactWithClient[], partners: [] as ContactWithClient[], prospects: [] as ContactWithClient[], other: [] as ContactWithClient[] }
    for (const c of filtered) g[classifyGroup(c)].push(c)
    return g
  }, [filtered])

  async function handleDelete(id: string) {
    setDeleting(id)
    startTx(async () => {
      try { await deleteContact(id); setContacts(prev => prev.filter(c => c.id !== id)) }
      finally { setDeleting(null) }
    })
  }

  function handleUpdate(updated: ContactWithClient) {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Contacts</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}><span className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>{contacts.length}</span> contacts across {clients.length} clients</p>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><Plus size={14} strokeWidth={2.5} /> Add Contact</button>
        </div>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." style={{ paddingLeft: '30px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', fontSize: '13px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none', width: '240px', fontFamily: 'inherit' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '0', display: 'flex' }}><X size={12} /></button>}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        {showAdd && <AddContactForm clients={clients} onAdd={c => { setContacts(prev => [c, ...prev]); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />}
        {contacts.length === 0 && !showAdd ? (
          <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ fontSize: '14px', color: 'var(--text-faint)' }}>No contacts yet.</p></div>
        ) : (
          GROUP_ORDER.map(groupKey => {
            const items = grouped[groupKey]
            if (items.length === 0) return null
            return (
              <div key={groupKey} style={{ marginBottom: '28px' }}>
                <p className="label" style={{ marginBottom: '10px', paddingLeft: '4px' }}>{GROUP_LABELS[groupKey]} · {items.length}</p>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {items.map((c, i) => (
                    <div key={c.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <ContactRow contact={c} clients={clients} deleting={deleting} onDelete={handleDelete} onUpdate={handleUpdate} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
        <datalist id="role-suggestions">{ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}</datalist>
      </div>
    </div>
  )
}
