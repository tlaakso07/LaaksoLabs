import { useState, useTransition, useMemo } from 'react'
import { Check, Plus, X, Trash2, Download } from 'lucide-react'
import type { Task, Client, TaskPriority, TaskCategory } from '@/lib/supabase/types'
import { createTask, completeTask, deleteTask } from '@/lib/supabase/queries/tasks'
import { isOverdue, isDueToday } from '@/lib/utils'
import { DIVISION_LABELS } from '@/lib/constants'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { exportToCsv } from '@/lib/export-csv'

type ClientRef = Pick<Client, 'id' | 'name' | 'division'>
type ViewMode = 'today' | 'week' | 'client' | 'all'
const PRIORITY_ORDER: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
const PRIORITY_COLOR: Record<TaskPriority, string> = { urgent: 'var(--urgent)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' }
const CATEGORIES: TaskCategory[] = ['sales', 'delivery', 'operations', 'creative', 'campaigns']
const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

function getWeekEnd(): string { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] }

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TaskRow({ task, clients, completing, deleting, onComplete, onDelete }: { task: Task; clients: ClientRef[]; completing: string | null; deleting: string | null; onComplete: (id: string) => void; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)
  const overdue = isOverdue(task.due_date), dueToday = isDueToday(task.due_date)
  const color = PRIORITY_COLOR[task.priority], isDone = task.status === 'done'
  const isComp = completing === task.id, isDel = deleting === task.id
  const client = clients.find(c => c.id === task.client_id)
  return (
    <div style={{ opacity: isComp || isDel ? 0.35 : 1, transition: 'opacity 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', background: hovered ? 'var(--surface-2)' : 'transparent', transition: 'background 100ms ease' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <button onClick={() => onComplete(task.id)} disabled={!!completing || isDone} style={{ width: '18px', height: '18px', borderRadius: '50%', border: `1.5px solid ${isComp || isDone ? 'var(--active)' : color}`, background: isComp || isDone ? 'var(--active)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', cursor: isDone ? 'default' : 'pointer', transition: 'all 150ms ease' }}>
          {(isComp || isDone) && <Check size={10} color="white" />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', lineHeight: '1.4', color: isDone ? 'var(--text-faint)' : overdue ? 'var(--urgent)' : 'var(--text)', marginBottom: '4px', textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`priority-chip ${task.priority}`}><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />{task.priority}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'capitalize' }}>{task.category}</span>
            {client && <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '1px 6px', borderRadius: '4px' }}>{client.name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {task.due_date && <span style={{ fontSize: '11px', color: overdue ? 'var(--urgent)' : dueToday ? 'var(--high)' : 'var(--text-faint)', fontWeight: overdue || dueToday ? 500 : 400 }}>{formatDueDate(task.due_date)}</span>}
          <button onClick={() => onDelete(task.id)} disabled={!!deleting} style={{ opacity: hovered ? 0.45 : 0, transition: 'opacity 150ms ease', padding: '2px', borderRadius: '4px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  )
}

function AddTaskRow({ clients, onAdd }: { clients: ClientRef[]; onAdd: (t: { title: string; priority: TaskPriority; category: TaskCategory; client_id: string | null; due_date: string | null }) => void }) {
  const [show, setShow] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [category, setCategory] = useState<TaskCategory>('operations')
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState('')

  const SEL: React.CSSProperties = { padding: '5px 8px', fontSize: '11px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }

  if (!show) return <button onClick={() => setShow(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', width: '100%' }}><Plus size={13} /> Add task</button>

  return (
    <div style={{ padding: '12px 14px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && title.trim()) { onAdd({ title: title.trim(), priority, category, client_id: clientId || null, due_date: dueDate || null }); setTitle(''); setShow(false) } if (e.key === 'Escape') setShow(false) }} placeholder="Task title..." style={{ width: '100%', padding: '7px 10px', fontSize: '13px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', marginBottom: '10px', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={SEL}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select>
        <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)} style={SEL}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={clientId} onChange={e => setClientId(e.target.value)} style={SEL}><option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={SEL} />
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          <button onClick={() => { if (title.trim()) { onAdd({ title: title.trim(), priority, category, client_id: clientId || null, due_date: dueDate || null }); setTitle(''); setShow(false) } }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}><Check size={11} /> Add</button>
          <button onClick={() => setShow(false)} style={{ padding: '5px', borderRadius: '6px', background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={11} /></button>
        </div>
      </div>
    </div>
  )
}

export function TasksView({ initialTasks, clients }: { initialTasks: Task[]; clients: ClientRef[] }) {
  const [tasks, setTasks] = useRealtimeTable<Task>('tasks', initialTasks)
  const [view, setView] = useState<ViewMode>('today')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | ''>('')
  const [clientFilter, setClientFilter] = useState('')
  const [completing, setCompleting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [, startTx] = useTransition()

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const weekEnd = getWeekEnd()
    let list = tasks.filter(t => t.status !== 'done')
    if (view === 'today') list = list.filter(t => t.due_date && t.due_date <= today)
    else if (view === 'week') list = list.filter(t => t.due_date && t.due_date <= weekEnd)
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter)
    if (categoryFilter) list = list.filter(t => t.category === categoryFilter)
    if (clientFilter) list = list.filter(t => t.client_id === clientFilter)
    return list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }, [tasks, view, priorityFilter, categoryFilter, clientFilter])

  async function handleComplete(id: string) {
    setCompleting(id)
    startTx(async () => {
      try { await completeTask(id); setTasks(prev => prev.filter(t => t.id !== id)) }
      finally { setCompleting(null) }
    })
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try { await deleteTask(id); setTasks(prev => prev.filter(t => t.id !== id)) }
    finally { setDeleting(null) }
  }

  async function handleAdd(payload: { title: string; priority: TaskPriority; category: TaskCategory; client_id: string | null; due_date: string | null }) {
    const newTask = await createTask({ ...payload, status: 'todo', description: null, completed_at: null })
    setTasks(prev => [newTask, ...prev])
  }

  const urgentCount = tasks.filter(t => t.status !== 'done' && t.priority === 'urgent').length
  const overdueCount = tasks.filter(t => t.status !== 'done' && isOverdue(t.due_date)).length
  const openCount = tasks.filter(t => t.status !== 'done').length

  const PILL: React.CSSProperties = { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, border: '1px solid', cursor: 'pointer', transition: 'all 80ms ease' }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Tasks</h1>
            <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}><span className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>{openCount}</span> open</span>
              {urgentCount > 0 && <span style={{ fontSize: '12px', color: 'var(--urgent)' }}><span className="num" style={{ fontWeight: 700 }}>{urgentCount}</span> urgent</span>}
              {overdueCount > 0 && <span style={{ fontSize: '12px', color: 'var(--urgent)' }}><span className="num" style={{ fontWeight: 700 }}>{overdueCount}</span> overdue</span>}
            </div>
          </div>
          <button onClick={() => exportToCsv(`tasks-${new Date().toISOString().slice(0,10)}.csv`, tasks.filter(t => t.status !== 'done').map(t => ({ Title: t.title, Priority: t.priority, Category: t.category, Status: t.status, 'Due Date': t.due_date ?? '', Client: clients.find(c => c.id === t.client_id)?.name ?? '' })))} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}><Download size={13} /> CSV</button>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(['today', 'week', 'all'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ ...PILL, background: view === v ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface-1)', color: view === v ? 'var(--accent)' : 'var(--text-muted)', borderColor: view === v ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)' }}>{v === 'today' ? 'Due Today' : v === 'week' ? 'This Week' : 'All Open'}</button>
          ))}
          <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 4px' }} />
          {(['', ...PRIORITIES] as (TaskPriority | '')[]).map(p => (
            <button key={p || 'all'} onClick={() => setPriorityFilter(p)} style={{ ...PILL, background: priorityFilter === p ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface-1)', color: priorityFilter === p ? 'var(--accent)' : 'var(--text-muted)', borderColor: priorityFilter === p ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)' }}>{p || 'All Priority'}</button>
          ))}
          <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 4px' }} />
          {['', ...CATEGORIES].map(c => (
            <button key={c || 'all'} onClick={() => setCategoryFilter(c as TaskCategory | '')} style={{ ...PILL, background: categoryFilter === c ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface-1)', color: categoryFilter === c ? 'var(--accent)' : 'var(--text-muted)', borderColor: categoryFilter === c ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)' }}>{c || 'All'}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div className="card" style={{ margin: '20px 28px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
                {view === 'today' ? 'Nothing due today.' : view === 'week' ? 'Nothing due this week.' : 'No open tasks.'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Press N to add a task quickly</p>
            </div>
          ) : (
            filtered.map((task, i) => (
              <div key={task.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <TaskRow task={task} clients={clients} completing={completing} deleting={deleting} onComplete={handleComplete} onDelete={handleDelete} />
              </div>
            ))
          )}
          <AddTaskRow clients={clients} onAdd={handleAdd} />
        </div>
      </div>
    </div>
  )
}
