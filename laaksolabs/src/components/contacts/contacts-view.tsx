'use client'

import { useState, useTransition, useMemo } from 'react'
import { Search, Plus, X, Trash2, Phone, Mail, ExternalLink, Pencil, Save } from 'lucide-react'
import Link from 'next/link'
import type { Contact, Client } from '@/lib/supabase/types'
import { createContact, deleteContact } from '@/lib/supabase/queries/contacts'
import { createClient } from '@/lib/supabase/client'



type ClientRef = Pick<Client, 'id' | 'name' | 'division'>

export type ContactWithClient = Contact & {
  clients: { name: string } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const GROUP_LABELS = {
  clients:   'Clients',
  partners:  'Partners',
  prospects: 'Prospects',
  other:     'Other',
} as const

const GROUP_ORDER: Array<keyof typeof GROUP_LABELS> = ['clients', 'partners', 'prospects', 'other']

const ROLE_SUGGESTIONS = [
  'Client Owner',
  'White-Label Partner',
  'Prospect',
  'Vendor',
  'Advisor',
  'Contact',
]

// ─── Contact Row ─────────────────────────────────────────────────────────────

function ContactRow({
  contact,
  clients,
  deleting,
  onDelete,
  onUpdate,
}: {
  contact: ContactWithClient
  clients: ClientRef[]
  deleting: string | null
  onDelete: (id: string) => void
  onUpdate: (updated: ContactWithClient) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({
    name:      contact.name,
    role:      contact.role      ?? '',
    company:   contact.company   ?? '',
    phone:     contact.phone     ?? '',
    email:     contact.email     ?? '',
    client_id: contact.client_id ?? '',
    notes:     contact.notes     ?? '',
  })

  const isDel = deleting === contact.id
  const linkedClient = clients.find(c => c.id === contact.client_id)

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function save() {
    if (!form.name.trim() || saving) return
    setSaving(true)
    const { data, error } = await createClient()
      .from('contacts')
      .update({
        name:      form.name.trim(),
        role:      form.role.trim()      || null,
        company:   form.company.trim()   || null,
        phone:     form.phone.trim()     || null,
        email:     form.email.trim()     || null,
        client_id: form.client_id        || null,
        notes:     form.notes.trim()     || null,
      })
      .eq('id', contact.id)
      .select('*, clients(name)')
      .single()
    setSaving(false)
    if (!error && data) {
      onUpdate(data as ContactWithClient)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input value={form.name}      onChange={e => f('name', e.target.value)}      placeholder="Full name *"  style={INPUT_STYLE} />
          <input value={form.role}      onChange={e => f('role', e.target.value)}       placeholder="Role"         style={INPUT_STYLE} list="role-suggestions" />
          <input value={form.company}   onChange={e => f('company', e.target.value)}    placeholder="Company"      style={INPUT_STYLE} />
          <select value={form.client_id} onChange={e => f('client_id', e.target.value)} style={INPUT_STYLE}>
            <option value="">No linked client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={form.phone}     onChange={e => f('phone', e.target.value)}      placeholder="Phone"        style={INPUT_STYLE} type="tel" />
          <input value={form.email}     onChange={e => f('email', e.target.value)}      placeholder="Email"        style={INPUT_STYLE} type="email" />
        </div>
        <textarea
          value={form.notes}
          onChange={e => f('notes', e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'inherit', marginBottom: '12px' }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setEditing(false)}
            style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '7px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: saving || !form.name.trim() ? 0.6 : 1 }}
          >
            <Save size={12} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ opacity: isDel ? 0.35 : 1, transition: 'opacity 0.2s ease' }}>
      <div
        className="flex items-center gap-4"
        style={{
          padding: '12px 16px',
          background: hovered ? 'var(--surface-2)' : 'transparent',
          transition: 'background 100ms ease',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Avatar */}
        <div
          style={{
            width: '38px', height: '38px',
            borderRadius: '50%',
            background: 'var(--surface-3)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: '13px', fontWeight: 600,
            color: 'var(--text-muted)', letterSpacing: '0.02em',
          }}
        >
          {getInitials(contact.name)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {contact.name}
            </span>
            {linkedClient && (
              <Link
                href={`/clients/${linkedClient.id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  fontSize: '10px', fontWeight: 600,
                  padding: '1px 6px', borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-3)', color: 'var(--text-muted)',
                  textDecoration: 'none', transition: 'border-color 100ms ease',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
              >
                {linkedClient.name}
                <ExternalLink size={9} />
              </Link>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {[contact.role, contact.company].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              title={contact.phone}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '12px', color: 'var(--text-muted)',
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: hovered ? 'var(--surface-3)' : 'transparent',
                textDecoration: 'none', transition: 'all 100ms ease', whiteSpace: 'nowrap',
              }}
            >
              <Phone size={12} />
              {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              title={contact.email}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '12px', color: 'var(--text-muted)',
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: hovered ? 'var(--surface-3)' : 'transparent',
                textDecoration: 'none', transition: 'all 100ms ease', whiteSpace: 'nowrap',
              }}
            >
              <Mail size={12} />
              {contact.email}
            </a>
          )}

          {/* Edit */}
          <button
            onClick={() => setEditing(true)}
            style={{
              opacity: hovered ? 0.6 : 0,
              transition: 'opacity 150ms ease',
              padding: '4px 8px', borderRadius: '6px',
              cursor: 'pointer', background: 'var(--surface-3)',
              border: '1px solid var(--border)', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 500,
            }}
          >
            <Pencil size={11} />
            Edit
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(contact.id)}
            disabled={!!deleting}
            style={{
              opacity: hovered ? 0.45 : 0,
              transition: 'opacity 150ms ease',
              padding: '4px', borderRadius: '4px',
              cursor: 'pointer', background: 'transparent',
              border: 'none', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Notes (if present) */}
      {contact.notes && hovered && (
        <div style={{ padding: '0 16px 10px 70px', fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic' }}>
          {contact.notes}
        </div>
      )}
    </div>
  )
}

// ─── Add Contact Form ─────────────────────────────────────────────────────────

const INPUT_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: '13px',
  padding: '7px 10px',
  outline: 'none',
  transition: 'border-color 120ms ease',
  width: '100%',
} as const

function focusOn(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent)'
}
function focusOff(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border)'
}

function AddContactForm({
  clients,
  onAdd,
  onCancel,
}: {
  clients: ClientRef[]
  onAdd: (contact: ContactWithClient) => void
  onCancel: () => void
}) {
  const [name,     setName]     = useState('')
  const [role,     setRole]     = useState('')
  const [company,  setCompany]  = useState('')
  const [phone,    setPhone]    = useState('')
  const [email,    setEmail]    = useState('')
  const [clientId, setClientId] = useState('')
  const [notes,    setNotes]    = useState('')
  const [adding,   setAdding]   = useState(false)
  const [, startTx] = useTransition()

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    startTx(async () => {
      try {
        const created = await createContact({
          name: name.trim(),
          role: role.trim() || null,
          company: company.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          client_id: clientId || null,
          notes: notes.trim() || null,
        })
        const linkedClientName = clients.find(c => c.id === clientId)?.name ?? null
        onAdd({ ...created, clients: linkedClientName ? { name: linkedClientName } : null })
      } finally {
        setAdding(false)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card animate-in"
      style={{ padding: '20px', marginBottom: '24px' }}
    >
      <p style={{
        fontSize: '13px', fontWeight: 600,
        color: 'var(--text)', marginBottom: '14px',
        letterSpacing: '-0.01em',
      }}>
        New Contact
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <input
          autoFocus
          type="text"
          placeholder="Full name *"
          value={name}
          onChange={e => setName(e.target.value)}
          style={INPUT_STYLE}
          onFocus={focusOn} onBlur={focusOff}
        />
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Role"
            value={role}
            onChange={e => setRole(e.target.value)}
            list="role-suggestions"
            style={INPUT_STYLE}
            onFocus={focusOn} onBlur={focusOff}
          />
          <datalist id="role-suggestions">
            {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
          </datalist>
        </div>
        <input
          type="text"
          placeholder="Company"
          value={company}
          onChange={e => setCompany(e.target.value)}
          style={INPUT_STYLE}
          onFocus={focusOn} onBlur={focusOff}
        />
        <select
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          style={INPUT_STYLE}
          onFocus={focusOn} onBlur={focusOff}
        >
          <option value="">No linked client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={INPUT_STYLE}
          onFocus={focusOn} onBlur={focusOff}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={INPUT_STYLE}
          onFocus={focusOn} onBlur={focusOff}
        />
      </div>

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
        style={{
          ...INPUT_STYLE,
          resize: 'vertical',
          fontFamily: 'inherit',
          marginBottom: '14px',
        }}
        onFocus={focusOn} onBlur={focusOff}
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || adding}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '13px', fontWeight: 500,
            cursor: 'pointer',
            opacity: !name.trim() || adding ? 0.5 : 1,
            transition: 'opacity 150ms ease',
          }}
        >
          {adding ? 'Saving…' : 'Add Contact'}
        </button>
      </div>
    </form>
  )
}

// ─── Group Section ────────────────────────────────────────────────────────────

function GroupSection({
  label,
  contacts,
  clients,
  deleting,
  onDelete,
  onUpdate,
}: {
  label: string
  contacts: ContactWithClient[]
  clients: ClientRef[]
  deleting: string | null
  onDelete: (id: string) => void
  onUpdate: (updated: ContactWithClient) => void
}) {
  if (contacts.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-3" style={{ marginBottom: '8px' }}>
        <p className="label">{label}</p>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-faint)', background: 'var(--surface-3)', padding: '1px 6px', borderRadius: '10px' }}>
          {contacts.length}
        </span>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {contacts.map((c, i) => (
          <div key={c.id} style={{ borderBottom: i < contacts.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <ContactRow contact={c} clients={clients} deleting={deleting} onDelete={onDelete} onUpdate={onUpdate} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContactsView({
  initialContacts,
  clients,
}: {
  initialContacts: ContactWithClient[]
  clients: ClientRef[]
}) {
  const [contacts,    setContacts]    = useState(initialContacts)
  const [search,      setSearch]      = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [, startTx] = useTransition()

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.role ?? '').toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.clients?.name ?? '').toLowerCase().includes(q)
    )
  }, [contacts, search])

  const groups = useMemo(() => {
    const buckets: Record<string, ContactWithClient[]> = {
      clients: [], partners: [], prospects: [], other: [],
    }
    for (const c of filtered) {
      buckets[classifyGroup(c)].push(c)
    }
    return buckets
  }, [filtered])

  const totalVisible = filtered.length

  const handleDelete = (id: string) => {
    setDeleting(id)
    startTx(async () => {
      try {
        await deleteContact(id)
        setContacts(prev => prev.filter(c => c.id !== id))
      } finally {
        setDeleting(null)
      }
    })
  }

  const handleAdd = (contact: ContactWithClient) => {
    setContacts(prev => [contact, ...prev])
    setShowAddForm(false)
  }

  const handleUpdate = (updated: ContactWithClient) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const groupProps = { clients, deleting, onDelete: handleDelete, onUpdate: handleUpdate }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '20px 32px',
        background: 'var(--surface-1)',
        flexShrink: 0,
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '22px', fontWeight: 700,
              color: 'var(--text)', letterSpacing: '-0.03em',
              lineHeight: 1.2, marginBottom: '4px',
            }}>
              Contacts
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              background: showAddForm ? 'var(--surface-2)' : 'var(--accent)',
              border: showAddForm ? '1px solid var(--border)' : 'none',
              color: showAddForm ? 'var(--text-muted)' : '#fff',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? 'Cancel' : 'Add Contact'}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search by name, role, company, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              fontSize: '13px',
              padding: '9px 12px 9px 34px',
              outline: 'none',
              transition: 'border-color 120ms ease',
            }}
            onFocus={e  => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent', border: 'none',
                color: 'var(--text-faint)', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>

        {showAddForm && (
          <AddContactForm
            clients={clients}
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {totalVisible === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '6px', padding: '60px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
              {search ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              {search ? 'Try a different name, company, or role' : 'Add your first contact above'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {GROUP_ORDER.map(key => (
              <GroupSection
                key={key}
                label={GROUP_LABELS[key]}
                contacts={groups[key]}
                {...groupProps}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
