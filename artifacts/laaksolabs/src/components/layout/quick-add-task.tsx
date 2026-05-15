import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { TaskPriority, TaskCategory, Client } from '@/lib/supabase/types'
import { TASK_PRIORITY_COLORS } from '@/lib/constants'

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
const CATEGORIES: TaskCategory[] = ['sales', 'delivery', 'operations', 'creative', 'campaigns']

interface Props { open: boolean; onClose: () => void }

export function QuickAddTask({ open, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [category, setCategory] = useState<TaskCategory>('operations')
  const [dueDate, setDueDate] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 10)
    if (!isSupabaseConfigured()) return
    createClient().from('clients').select('id, name').eq('status', 'active')
      .then(({ data }: { data: unknown[] | null }) => setClients((data ?? []) as Client[]))
  }, [open])

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && title.trim() && isSupabaseConfigured()) {
        setSaving(true)
        createClient().from('tasks').insert({
          title: title.trim(), priority, category, status: 'todo',
          due_date: dueDate || null, client_id: clientId || null,
          description: null, completed_at: null,
        }).then(() => { setSaving(false); onClose() })
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, title, priority, category, dueDate, clientId, onClose])

  if (!open) return null

  const INPUT_STYLE: React.CSSProperties = {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    padding: '6px 10px', outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '14vh 16px 0' }}
    >
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: '16px', boxShadow: 'var(--shadow-elevated)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Quick Add Task</p>
          <button onClick={onClose} style={{ ...INPUT_STYLE, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={12} />
          </button>
        </div>
        <input
          ref={inputRef}
          type="text" placeholder="Task title…" value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ ...INPUT_STYLE, width: '100%', fontSize: '14px', marginBottom: '12px', padding: '8px 12px' }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={INPUT_STYLE}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)} style={INPUT_STYLE}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select value={clientId} onChange={e => setClientId(e.target.value)} style={INPUT_STYLE}>
            <option value="">No client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={INPUT_STYLE} />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={async () => {
              if (!title.trim() || saving) return
              setSaving(true)
              await createClient().from('tasks').insert({ title: title.trim(), priority, category, status: 'todo', due_date: dueDate || null, client_id: clientId || null, description: null, completed_at: null })
              setSaving(false); onClose()
            }}
            disabled={!title.trim() || saving}
            style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: !title.trim() || saving ? 0.5 : 1 }}
          >
            {saving ? 'Adding…' : 'Add Task (⌘↵)'}
          </button>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
          {PRIORITIES.map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              style={{
                padding: '3px 8px', borderRadius: '6px', border: `1px solid ${priority === p ? TASK_PRIORITY_COLORS[p] : 'transparent'}`,
                background: priority === p ? `color-mix(in srgb, ${TASK_PRIORITY_COLORS[p]} 12%, transparent)` : 'transparent',
                color: priority === p ? TASK_PRIORITY_COLORS[p] : 'var(--text-muted)',
                fontSize: '10px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
