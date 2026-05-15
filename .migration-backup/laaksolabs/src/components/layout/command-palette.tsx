'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LayoutDashboard, Users, CheckSquare, Package, DollarSign, BookUser, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client, Task, TaskPriority } from '@/lib/supabase/types'
import { TASK_PRIORITY_COLORS } from '@/lib/constants'

const PAGES = [
  { label: 'Dashboard',  href: '/',          description: 'Overview & KPIs',        icon: LayoutDashboard },
  { label: 'Clients',    href: '/clients',   description: 'Client CRM & pipeline',  icon: Users },
  { label: 'Tasks',      href: '/tasks',     description: 'Task management',         icon: CheckSquare },
  { label: 'Happy Dog',  href: '/happydog',  description: 'White-label orders',      icon: Package },
  { label: 'Revenue',    href: '/revenue',   description: 'Invoices & MRR',          icon: DollarSign },
  { label: 'Contacts',   href: '/contacts',  description: 'Contact directory',       icon: BookUser },
  { label: 'Settings',   href: '/settings',  description: 'App configuration',       icon: Settings },
]

type Icon = React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>

type ResultItem =
  | { kind: 'page';   label: string; description: string; href: string; icon: Icon }
  | { kind: 'client'; label: string; description: string; href: string }
  | { kind: 'task';   label: string; description: string; href: string; priority: TaskPriority }

interface Props { open: boolean; onClose: () => void }

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter()
  const [query, setQuery]     = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [tasks, setTasks]     = useState<Task[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 10)
    const sb = createClient()
    sb.from('clients').select('*').then(({ data }) => setClients((data ?? []) as Client[]))
    sb.from('tasks').select('*').neq('status', 'done').then(({ data }) => setTasks((data ?? []) as Task[]))
  }, [open])

  const results: ResultItem[] = (() => {
    const q = query.toLowerCase().trim()
    if (!q) return PAGES.map(p => ({ kind: 'page' as const, ...p }))
    const pages: ResultItem[] = PAGES
      .filter(p => p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .map(p => ({ kind: 'page' as const, ...p }))
    const matchedClients: ResultItem[] = clients
      .filter(c => c.name.toLowerCase().includes(q) || c.owner_name?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(c => ({ kind: 'client' as const, label: c.name, description: c.owner_name ?? c.status, href: `/clients/${c.id}` }))
    const matchedTasks: ResultItem[] = tasks
      .filter(t => t.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({ kind: 'task' as const, label: t.title, description: t.priority, href: '/tasks', priority: t.priority }))
    return [...pages, ...matchedClients, ...matchedTasks]
  })()


  const navigate = useCallback((item: ResultItem) => {
    router.push(item.href); onClose()
  }, [router, onClose])

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape')    { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && results[selected]) navigate(results[selected])
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, results, selected, navigate, onClose])

  if (!open) return null

  const groups = [
    { label: 'Pages',   items: results.filter(r => r.kind === 'page') },
    { label: 'Clients', items: results.filter(r => r.kind === 'client') },
    { label: 'Tasks',   items: results.filter(r => r.kind === 'task') },
  ].filter(g => g.items.length > 0)

  let globalIdx = 0

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '14vh', padding: '14vh 16px 0',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '560px',
        background: 'var(--surface-1)',
        border: '1px solid var(--border-strong)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden',
      }}>
        {/* Search row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: results.length ? '1px solid var(--border)' : 'none',
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Search pages, clients, tasks…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '15px', color: 'var(--text)', fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontFamily: 'inherit',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
            {groups.map(group => (
              <div key={group.label}>
                <p style={{
                  fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-faint)',
                  padding: '6px 10px 4px',
                }}>
                  {group.label}
                </p>
                {group.items.map(item => {
                  const i = globalIdx++
                  const active = i === selected
                  return (
                    <button
                      key={`${item.kind}-${item.href}-${item.label}`}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setSelected(i)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '9px 10px', borderRadius: '8px', border: 'none',
                        background: active ? 'var(--surface-2)' : 'transparent',
                        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 80ms ease',
                      }}
                    >
                      {item.kind === 'page' && (
                        <item.icon size={14} strokeWidth={1.5} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      )}
                      {item.kind === 'client' && (
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0 }} />
                      )}
                      {item.kind === 'task' && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: TASK_PRIORITY_COLORS[item.priority] }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </p>
                        {item.description && (
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Footer hints */}
        <div style={{
          borderTop: '1px solid var(--border)', padding: '8px 16px',
          display: 'flex', gap: '16px',
        }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'inherit' }}>{key}</kbd>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
