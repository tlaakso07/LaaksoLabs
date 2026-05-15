'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TaskPriority, TaskCategory, Client } from '@/lib/supabase/types'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/lib/constants'

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
const CATEGORIES: TaskCategory[] = ['sales', 'delivery', 'operations', 'creative', 'campaigns']

interface Props { open: boolean; onClose: () => void }

export function QuickAddTask({ open, onClose }: Props) {
  const [title, setTitle]       = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [category, setCategory] = useState<TaskCategory>('operations')
  const [dueDate, setDueDate]   = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients]   = useState<Client[]>([])
  const [saving, setSaving]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 10)
    createClient()
      .from('clients').select('id, name').eq('status', 'active')
      .then(({ data }) => setClients((data ?? []) as Client[]))
  }, [open])

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && title.trim()) {
        setSaving(true)
        createClient().from('tasks').insert({
          title: title.trim(), priority, category, status: 'todo',
          due_date: dueDate || null, client_id: clientId || null,
        }).then(() => { setSaving(false); onClose() })
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, title, priority, category, dueDate, clientId, onClose])

  async function save() {
    if (!title.trim() || saving) return
    setSaving(true)
    await createClient().from('tasks').insert({
      title: title.trim(), priority, category, status: 'todo',
      due_date: dueDate || null, client_id: clientId || null,
    })
    setSaving(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '460px',
        background: 'var(--surface-1)',
        border: '1px solid var(--border-strong)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>New Task</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Press N from anywhere to open</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'inherit' }}>⌘↵</kbd>
            <button
              onClick={onClose}
              style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to get done?"
            style={{
              width: '100%', padding: '10px 14px', fontSize: '15px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: '10px', color: 'var(--text)', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />

          {/* Priority */}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Priority</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                    border: '1px solid', cursor: 'pointer',
                    background: priority === p ? `${TASK_PRIORITY_COLORS[p]}22` : 'var(--surface-2)',
                    color: priority === p ? TASK_PRIORITY_COLORS[p] : 'var(--text-muted)',
                    borderColor: priority === p ? `${TASK_PRIORITY_COLORS[p]}55` : 'var(--border)',
                    transition: 'all 100ms ease',
                  }}
                >
                  {TASK_PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Category + Due date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Category</p>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Due Date</p>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Client */}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Client (optional)</p>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <option value="">No client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'var(--accent)', border: 'none', color: '#fff', cursor: saving || !title.trim() ? 'not-allowed' : 'pointer', opacity: saving || !title.trim() ? 0.6 : 1 }}
          >
            {saving ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
