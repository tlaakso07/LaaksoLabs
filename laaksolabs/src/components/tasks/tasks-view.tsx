'use client'

import { useState, useTransition, useMemo } from 'react'
import { Check, Plus, X, Trash2 } from 'lucide-react'
import type { Task, Client, TaskPriority, TaskCategory } from '@/lib/supabase/types'
import { createTask, completeTask, deleteTask } from '@/lib/supabase/queries/tasks'
import { isOverdue, isDueToday } from '@/lib/utils'
import { DIVISION_LABELS } from '@/lib/constants'
import { useRealtimeTable } from '@/hooks/use-realtime-table'

type ClientRef = Pick<Client, 'id' | 'name' | 'division'>
type ViewMode = 'today' | 'week' | 'client' | 'all'

const PRIORITY_ORDER: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: 'var(--urgent)',
  high:   'var(--high)',
  medium: 'var(--medium)',
  low:    'var(--low)',
}

const CATEGORIES: TaskCategory[] = ['sales', 'delivery', 'operations', 'creative', 'campaigns']
const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

function getWeekEnd(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Task Row ───────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task
  clients: ClientRef[]
  completing: string | null
  deleting: string | null
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}

function TaskRow({ task, clients, completing, deleting, onComplete, onDelete }: TaskRowProps) {
  const [hovered, setHovered] = useState(false)
  const overdue   = isOverdue(task.due_date)
  const dueToday  = isDueToday(task.due_date)
  const color     = PRIORITY_COLOR[task.priority]
  const isDone    = task.status === 'done'
  const isComp    = completing === task.id
  const isDel     = deleting === task.id
  const client    = clients.find(c => c.id === task.client_id)

  return (
    <div style={{ opacity: isComp || isDel ? 0.35 : 1, transition: 'opacity 0.2s ease' }}>
      <div
        className="flex items-start gap-3"
        style={{
          padding: '10px 14px',
          background: hovered ? 'var(--surface-2)' : 'transparent',
          transition: 'background 100ms ease',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Complete button */}
        <button
          onClick={() => onComplete(task.id)}
          disabled={!!completing || isDone}
          style={{
            width: '18px', height: '18px',
            borderRadius: '50%',
            border: `1.5px solid ${isComp || isDone ? 'var(--active)' : color}`,
            background: isComp || isDone ? 'var(--active)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: '2px',
            cursor: isDone ? 'default' : 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {(isComp || isDone) && <Check size={10} color="white" />}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '14px',
            lineHeight: '1.4',
            color: isDone
              ? 'var(--text-faint)'
              : overdue
                ? 'var(--urgent)'
                : 'var(--text)',
            marginBottom: '4px',
            textDecoration: isDone ? 'line-through' : 'none',
          }}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`priority-chip ${task.priority}`}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: color, flexShrink: 0, display: 'inline-block',
              }} />
              {task.priority}
            </span>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-faint)',
              textTransform: 'capitalize',
            }}>
              {task.category}
            </span>
            {client && (
              <span style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'var(--surface-3)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}>
                {client.name}
              </span>
            )}
          </div>
        </div>

        {/* Right: due date + delete */}
        <div className="flex items-center gap-2 shrink-0">
          {task.due_date && (
            <span style={{
              fontSize: '11px',
              color: overdue ? 'var(--urgent)' : dueToday ? 'var(--high)' : 'var(--text-faint)',
              fontWeight: overdue || dueToday ? 500 : 400,
            }}>
              {formatDueDate(task.due_date)}
            </span>
          )}
          <button
            onClick={() => onDelete(task.id)}
            disabled={!!deleting}
            style={{
              opacity: hovered ? 0.45 : 0,
              transition: 'opacity 150ms ease',
              padding: '2px',
              borderRadius: '4px',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Task List Card ──────────────────────────────────────────────────────────

function TaskListCard({
  tasks, clients, completing, deleting, onComplete, onDelete,
}: {
  tasks: Task[]
  clients: ClientRef[]
  completing: string | null
  deleting: string | null
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (tasks.length === 0) return null
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {tasks.map((task, i) => (
        <div
          key={task.id}
          style={{
            borderBottom: i < tasks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <TaskRow
            task={task}
            clients={clients}
            completing={completing}
            deleting={deleting}
            onComplete={onComplete}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Add Task Form ───────────────────────────────────────────────────────────

interface AddTaskFormProps {
  clients: ClientRef[]
  onAdd: (task: Task) => void
  onCancel: () => void
}

const INPUT_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: '13px',
  padding: '7px 10px',
  outline: 'none',
  transition: 'border-color 120ms ease',
} as const

function AddTaskForm({ clients, onAdd, onCancel }: AddTaskFormProps) {
  const [title,    setTitle]    = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [category, setCategory] = useState<TaskCategory>('operations')
  const [clientId, setClientId] = useState('')
  const [dueDate,  setDueDate]  = useState('')
  const [adding,   setAdding]   = useState(false)
  const [, startTx] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    startTx(async () => {
      try {
        const created = await createTask({
          title: title.trim(),
          description: null,
          client_id: clientId || null,
          priority,
          status: 'todo',
          due_date: dueDate || null,
          category,
          completed_at: null,
        })
        onAdd(created)
      } finally {
        setAdding(false)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card animate-in"
      style={{ padding: '16px', marginBottom: '20px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          autoFocus
          type="text"
          placeholder="Task title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ ...INPUT_STYLE, width: '100%', fontSize: '14px' }}
          onFocus={e  => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as TaskPriority)}
            style={INPUT_STYLE}
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={e => setCategory(e.target.value as TaskCategory)}
            style={INPUT_STYLE}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="">No client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={INPUT_STYLE}
          />

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || adding}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: !title.trim() || adding ? 0.5 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              {adding ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '6px', padding: '60px 24px', textAlign: 'center',
    }}>
      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>{message}</p>
      <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{sub}</p>
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <p
      className="label"
      style={{ marginBottom: '8px', marginTop: '0' }}
    >
      {text}
    </p>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TasksView({
  initialTasks,
  clients,
}: {
  initialTasks: Task[]
  clients: ClientRef[]
}) {
  const [tasks,       setTasks]       = useRealtimeTable<Task>('tasks', initialTasks)
  const [view,        setView]        = useState<ViewMode>('today')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDone,    setShowDone]    = useState(false)
  const [completing,  setCompleting]  = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [, startTx] = useTransition()

  const today   = new Date().toISOString().split('T')[0]
  const weekEnd = getWeekEnd()

  const sortByPriority = (a: Task, b: Task) =>
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]

  const openTasks = useMemo(
    () => tasks.filter(t => t.status !== 'done'),
    [tasks],
  )

  const overdueTasks = useMemo(
    () => openTasks.filter(t => t.due_date && t.due_date < today).sort(sortByPriority),
    [openTasks, today],
  )

  const dueTodayTasks = useMemo(
    () => openTasks.filter(t => t.due_date === today).sort(sortByPriority),
    [openTasks, today],
  )

  const weekTasks = useMemo(
    () => openTasks
      .filter(t => t.due_date && t.due_date > today && t.due_date <= weekEnd)
      .sort(sortByPriority),
    [openTasks, today, weekEnd],
  )

  const allTasks = useMemo(
    () => (showDone ? tasks : openTasks).sort(sortByPriority),
    [tasks, openTasks, showDone],
  )

  const clientGroups = useMemo(() => {
    const groups = new Map<string, { client: ClientRef | null; tasks: Task[] }>()

    for (const task of openTasks) {
      const key = task.client_id ?? '_none'
      if (!groups.has(key)) {
        const client = task.client_id
          ? (clients.find(c => c.id === task.client_id) ?? null)
          : null
        groups.set(key, { client, tasks: [] })
      }
      groups.get(key)!.tasks.push(task)
    }

    for (const g of groups.values()) {
      g.tasks.sort(sortByPriority)
    }

    return [...groups.entries()].sort(([kA, gA], [kB, gB]) => {
      if (kA === '_none') return 1
      if (kB === '_none') return -1
      return (gA.client?.name ?? '').localeCompare(gB.client?.name ?? '')
    })
  }, [openTasks, clients])

  const handleComplete = (id: string) => {
    setCompleting(id)
    startTx(async () => {
      try {
        await completeTask(id)
        setTasks(prev =>
          prev.map(t =>
            t.id === id
              ? { ...t, status: 'done', completed_at: new Date().toISOString() }
              : t,
          ),
        )
      } finally {
        setCompleting(null)
      }
    })
  }

  const handleDelete = (id: string) => {
    setDeleting(id)
    startTx(async () => {
      try {
        await deleteTask(id)
        setTasks(prev => prev.filter(t => t.id !== id))
      } finally {
        setDeleting(null)
      }
    })
  }

  const handleAddTask = (task: Task) => {
    setTasks(prev => [task, ...prev])
    setShowAddForm(false)
  }

  const rowProps = { clients, completing, deleting, onComplete: handleComplete, onDelete: handleDelete }

  const VIEWS: { key: ViewMode; label: string; count?: number }[] = [
    { key: 'today',  label: 'Today',     count: overdueTasks.length + dueTodayTasks.length },
    { key: 'week',   label: 'This Week', count: weekTasks.length },
    { key: 'client', label: 'By Client' },
    { key: 'all',    label: 'All' },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '20px 32px 0',
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
              Tasks
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {overdueTasks.length > 0
                ? `${overdueTasks.length} overdue · ${openTasks.length} open`
                : `${openTasks.length} open`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" title="Live updates">
              <span className="live-dot" />
              <span style={{ fontSize: '10px', color: 'var(--active)', fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
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
            {showAddForm ? 'Cancel' : 'Add Task'}
          </button>
          </div>
        </div>

        {/* View tabs */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: view === v.key ? 600 : 400,
                color: view === v.key ? 'var(--text)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${view === v.key ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 100ms ease',
                display: 'flex', alignItems: 'center', gap: '6px',
                marginBottom: '-1px',
              }}
            >
              {v.label}
              {v.count !== undefined && v.count > 0 && (
                <span style={{
                  fontSize: '10px', fontWeight: 600,
                  padding: '1px 5px', borderRadius: '10px',
                  background: view === v.key ? 'var(--accent-dim)' : 'var(--surface-3)',
                  color: view === v.key ? 'var(--accent)' : 'var(--text-faint)',
                }}>
                  {v.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>

        {showAddForm && (
          <AddTaskForm
            clients={clients}
            onAdd={handleAddTask}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Today view */}
        {view === 'today' && (() => {
          if (overdueTasks.length === 0 && dueTodayTasks.length === 0) {
            return <EmptyState message="Nothing due today" sub="You're all caught up." />
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {overdueTasks.length > 0 && (
                <div>
                  <SectionLabel text="Overdue" />
                  <TaskListCard tasks={overdueTasks} {...rowProps} />
                </div>
              )}
              {dueTodayTasks.length > 0 && (
                <div>
                  {overdueTasks.length > 0 && <SectionLabel text="Today" />}
                  <TaskListCard tasks={dueTodayTasks} {...rowProps} />
                </div>
              )}
            </div>
          )
        })()}

        {/* This Week view */}
        {view === 'week' && (
          weekTasks.length === 0
            ? <EmptyState message="Nothing due this week" sub="Clear week ahead." />
            : <TaskListCard tasks={weekTasks} {...rowProps} />
        )}

        {/* By Client view */}
        {view === 'client' && (
          clientGroups.length === 0
            ? <EmptyState message="No open tasks" sub="All tasks are complete." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {clientGroups.map(([key, group]) => (
                  <div key={key}>
                    <div
                      className="flex items-center gap-2"
                      style={{ marginBottom: '8px' }}
                    >
                      {group.client ? (
                        <>
                          <span style={{
                            fontSize: '13px', fontWeight: 600,
                            color: 'var(--text)', letterSpacing: '-0.01em',
                          }}>
                            {group.client.name}
                          </span>
                          <span className={`div-badge d${group.client.division.slice(-1)}`}>
                            {DIVISION_LABELS[group.client.division]}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          No client
                        </span>
                      )}
                      <span style={{
                        fontSize: '11px', color: 'var(--text-faint)', marginLeft: 'auto',
                      }}>
                        {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <TaskListCard tasks={group.tasks} {...rowProps} />
                  </div>
                ))}
              </div>
            )
        )}

        {/* All view */}
        {view === 'all' && (
          <div>
            <div
              className="flex items-center justify-end"
              style={{ marginBottom: '12px' }}
            >
              <button
                onClick={() => setShowDone(s => !s)}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                {showDone ? 'Hide completed' : 'Show completed'}
              </button>
            </div>
            {allTasks.length === 0
              ? <EmptyState message="No tasks" sub="Add a task to get started." />
              : <TaskListCard tasks={allTasks} {...rowProps} />
            }
          </div>
        )}

      </div>
    </div>
  )
}
