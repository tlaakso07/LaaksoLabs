'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Mail, Globe, MapPin,
  Edit2, Check, X, Plus, CheckCircle2,
  MessageSquare, PhoneCall, AtSign, Calendar,
  Trophy, DollarSign, ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client, Task, HappyDogOrder, ActivityLog, ClientStatus, Division, TaskPriority, TaskCategory, ActivityType, HappyDogStatus } from '@/lib/supabase/types'
import { DIVISION_LABELS, CLIENT_STATUS_LABELS, TASK_PRIORITY_LABELS, HAPPYDOG_STATUS_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate, calcMargin } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  client: Client
  initialTasks: Task[]
  initialOrders: HappyDogOrder[]
  initialActivity: ActivityLog[]
}

type Tab = 'overview' | 'tasks' | 'happydog' | 'activity' | 'notes'

// ─── Constants ────────────────────────────────────────────────────────────────

const DIV_CLASSES: Record<Division, string> = { div1: 'div-badge d1', div2: 'div-badge d2', div3: 'div-badge d3' }

const STATUS_COLOR: Record<ClientStatus, string> = {
  prospect: 'var(--prospect)', lead: 'var(--prospect)', proposal: 'var(--div2)',
  onboarding: 'var(--onboard)', active: 'var(--active)', paused: 'var(--paused)', churned: 'var(--paused)',
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: 'var(--urgent)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)',
}

const HD_STATUS_COLOR: Record<HappyDogStatus, string> = {
  not_ordered: 'var(--text-faint)', ordered: 'var(--prospect)', in_progress: 'var(--high)',
  review: 'var(--medium)', delivered: 'var(--active)', revision: 'var(--urgent)',
}

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  note: MessageSquare, call: PhoneCall, email: AtSign,
  meeting: Calendar, milestone: Trophy, payment: DollarSign,
}

const SERVICE_LABELS: Record<string, string> = {
  meta_ads: 'Meta Ads', google_ads: 'Google Ads', seo: 'SEO', brand_kit: 'Brand Kit',
}

const ALL_CLIENT_STATUSES: ClientStatus[] = ['prospect', 'lead', 'proposal', 'onboarding', 'active', 'paused', 'churned']
const HD_STATUSES: HappyDogStatus[] = ['not_ordered', 'ordered', 'in_progress', 'review', 'delivered', 'revision']
const TASK_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
const TASK_CATEGORIES: TaskCategory[] = ['sales', 'delivery', 'operations', 'creative', 'campaigns']
const ACTIVITY_TYPES: ActivityType[] = ['note', 'call', 'email', 'meeting', 'milestone', 'payment']

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClientDetail({ client: initialClient, initialTasks, initialOrders, initialActivity }: Props) {
  const [client, setClient] = useState(initialClient)
  const [tasks, setTasks] = useState(initialTasks)
  const [orders, setOrders] = useState(initialOrders)
  const [activity, setActivity] = useState(initialActivity)
  const [tab, setTab] = useState<Tab>('overview')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  // ─── Client Edit ──────────────────────────────────────────────────────────

  function startEdit() {
    setEditForm({
      name: client.name,
      owner_name: client.owner_name ?? '',
      division: client.division,
      status: client.status,
      retainer_amount: client.retainer_amount ?? undefined,
      phone: client.phone ?? '',
      email: client.email ?? '',
      website: client.website ?? '',
      location: client.location ?? '',
      notes: client.notes ?? '',
    })
    setEditMode(true)
  }

  async function saveEdit() {
    setSaving(true)
    const { data, error } = await supabase
      .from('clients')
      .update({ ...editForm, updated_at: new Date().toISOString() })
      .eq('id', client.id)
      .select()
      .single()
    if (!error && data) setClient(data as Client)
    setSaving(false)
    setEditMode(false)
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────

  async function completeTask(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t))
    await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id)
  }

  async function addTask(payload: { title: string; priority: TaskPriority; category: TaskCategory; due_date: string }) {
    const { data } = await supabase
      .from('tasks')
      .insert({ ...payload, client_id: client.id, status: 'todo', description: null, completed_at: null })
      .select()
      .single()
    if (data) setTasks(prev => [data as Task, ...prev])
  }

  // ─── Happy Dog ────────────────────────────────────────────────────────────

  async function updateOrderStatus(id: string, status: HappyDogStatus) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    await supabase.from('happydog_orders').update({ status }).eq('id', id)
  }

  // ─── Activity ─────────────────────────────────────────────────────────────

  async function logActivity(type: ActivityType, content: string) {
    const { data } = await supabase
      .from('activity_log')
      .insert({ client_id: client.id, type, content })
      .select()
      .single()
    if (data) setActivity(prev => [data as ActivityLog, ...prev])
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const openTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const totalHdCost = orders.reduce((s, o) => s + (o.hd_cost ?? 0), 0)
  const totalHdRevenue = orders.reduce((s, o) => s + (o.client_price ?? 0), 0)
  const hdMargin = calcMargin(totalHdCost, totalHdRevenue)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 28px 0', background: 'var(--bg)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '12px' }}>
          <Link href="/clients" style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none',
          }}>
            <ArrowLeft size={12} /> Clients
          </Link>
        </div>

        {/* Client header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            {editMode ? (
              <input
                value={String(editForm.name ?? '')}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                style={{
                  fontSize: '22px', fontWeight: 700, color: 'var(--text)',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '4px 10px', outline: 'none',
                  letterSpacing: '-0.03em', fontFamily: 'inherit', marginBottom: '8px',
                  display: 'block', width: '400px',
                }}
              />
            ) : (
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                {client.name}
              </h1>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className={DIV_CLASSES[client.division]}>
                {DIVISION_LABELS[client.division]}
              </span>
              {editMode ? (
                <select
                  value={String(editForm.status ?? client.status)}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value as ClientStatus }))}
                  style={{
                    fontSize: '12px', padding: '3px 8px', borderRadius: '6px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    color: STATUS_COLOR[editForm.status ?? client.status], fontFamily: 'inherit', outline: 'none',
                  }}
                >
                  {ALL_CLIENT_STATUSES.map(s => (
                    <option key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              ) : (
                <span style={{
                  fontSize: '12px', fontWeight: 500, padding: '3px 9px', borderRadius: '6px',
                  color: STATUS_COLOR[client.status],
                  background: `color-mix(in srgb, ${STATUS_COLOR[client.status]} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${STATUS_COLOR[client.status]} 28%, transparent)`,
                }}>
                  {CLIENT_STATUS_LABELS[client.status]}
                </span>
              )}

              {client.retainer_amount ? (
                <span className="num" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                  {formatCurrency(client.retainer_amount)}<span style={{ fontWeight: 400, color: 'var(--text-faint)', fontSize: '11px' }}>/mo</span>
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>No retainer set</span>
              )}

              {/* Contact links */}
              {client.phone && (
                <a href={`tel:${client.phone}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none',
                }}>
                  <Phone size={11} /> {client.phone}
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none',
                }}>
                  <Mail size={11} /> {client.email}
                </a>
              )}
              {client.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <MapPin size={11} /> {client.location}
                </span>
              )}
              {client.website && (
                <a href={client.website} target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none',
                }}>
                  <Globe size={11} /> Website
                </a>
              )}
            </div>
          </div>

          {/* Edit controls */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '16px' }}>
            {editMode ? (
              <>
                <button onClick={() => setEditMode(false)} style={ghostBtn}>
                  <X size={13} /> Cancel
                </button>
                <button onClick={saveEdit} disabled={saving} style={accentBtn}>
                  <Check size={13} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button onClick={startEdit} style={ghostBtn}>
                <Edit2 size={13} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-row" style={{ display: 'flex', gap: '0', marginBottom: '-1px' }}>
          {(['overview', 'tasks', 'happydog', 'activity', 'notes'] as Tab[]).map(t => {
            const labels: Record<Tab, string> = {
              overview: 'Overview', tasks: `Tasks${openTasks.length > 0 ? ` (${openTasks.length})` : ''}`,
              happydog: `Happy Dog${orders.length > 0 ? ` (${orders.length})` : ''}`,
              activity: 'Activity', notes: 'Notes',
            }
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px 16px', fontSize: '13px', fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? 'var(--text)' : 'var(--text-muted)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                  transition: 'all 100ms ease', letterSpacing: '-0.01em',
                }}
              >
                {labels[t]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        {tab === 'overview' && (
          <OverviewTab client={client} editMode={editMode} editForm={editForm} setEditForm={setEditForm}
            openTasks={openTasks} hdMargin={hdMargin} totalHdCost={totalHdCost} totalHdRevenue={totalHdRevenue} />
        )}
        {tab === 'tasks' && (
          <TasksTab openTasks={openTasks} doneTasks={doneTasks} onComplete={completeTask} onAdd={addTask} />
        )}
        {tab === 'happydog' && (
          <HappyDogTab orders={orders} onStatusChange={updateOrderStatus} />
        )}
        {tab === 'activity' && (
          <ActivityTab activity={activity} onLog={logActivity} />
        )}
        {tab === 'notes' && (
          <NotesTab client={client} onSave={async (notes) => {
            const { data } = await supabase.from('clients').update({ notes, updated_at: new Date().toISOString() }).eq('id', client.id).select().single()
            if (data) setClient(data as Client)
          }} />
        )}
      </div>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ client, editMode, editForm, setEditForm, openTasks, hdMargin, totalHdCost, totalHdRevenue }: {
  client: Client
  editMode: boolean
  editForm: Partial<Client>
  setEditForm: (fn: (f: Partial<Client>) => Partial<Client>) => void
  openTasks: Task[]
  hdMargin: number
  totalHdCost: number
  totalHdRevenue: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <KpiCard
          label="Monthly Retainer"
          value={client.retainer_amount ? formatCurrency(client.retainer_amount) : '—'}
          sub={client.retainer_amount ? 'per month' : 'not set'}
          accent={!!client.retainer_amount}
        />
        <KpiCard
          label="HD Spend / Revenue"
          value={totalHdRevenue > 0 ? formatCurrency(totalHdRevenue) : '—'}
          sub={totalHdCost > 0 ? `${formatCurrency(totalHdCost)} cost` : 'no orders yet'}
        />
        <KpiCard
          label="Gross Margin"
          value={totalHdRevenue > 0 ? `${hdMargin}%` : '—'}
          sub="on Happy Dog orders"
          accent={hdMargin >= 50}
        />
      </div>

      {/* Services + retainer edit */}
      <div className="card" style={{ padding: '20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '14px' }}>
          Client Details
        </p>
        {editMode ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Owner Name">
              <input value={String(editForm.owner_name ?? '')} onChange={e => setEditForm(f => ({ ...f, owner_name: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Monthly Retainer ($)">
              <input type="number" value={String(editForm.retainer_amount ?? '')} onChange={e => setEditForm(f => ({ ...f, retainer_amount: e.target.value ? Number(e.target.value) : undefined }))} style={inputStyle} />
            </Field>
            <Field label="Phone">
              <input value={String(editForm.phone ?? '')} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Email">
              <input type="email" value={String(editForm.email ?? '')} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Location">
              <input value={String(editForm.location ?? '')} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Website">
              <input value={String(editForm.website ?? '')} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <DetailRow label="Owner" value={client.owner_name} />
            <DetailRow label="Division" value={DIVISION_LABELS[client.division]} />
            <DetailRow label="Phone" value={client.phone} href={client.phone ? `tel:${client.phone}` : undefined} />
            <DetailRow label="Email" value={client.email} href={client.email ? `mailto:${client.email}` : undefined} />
            <DetailRow label="Location" value={client.location} />
            <DetailRow label="Website" value={client.website} href={client.website ?? undefined} />
          </div>
        )}

        {/* Services */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '8px' }}>
            Services
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(client.services ?? []).length === 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>No services added</span>
            )}
            {(client.services ?? []).map(s => (
              <span key={s} style={{
                fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '6px',
                background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)',
              }}>
                {SERVICE_LABELS[s] ?? s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Open tasks preview */}
      {openTasks.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '14px' }}>
            Open Tasks ({openTasks.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {openTasks.slice(0, 4).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                  color: PRIORITY_COLOR[task.priority],
                  background: `color-mix(in srgb, ${PRIORITY_COLOR[task.priority]} 12%, transparent)`,
                }}>
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text)' }}>{task.title}</span>
                {task.due_date && (
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: 'auto' }}>
                    {formatDate(task.due_date)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ openTasks, doneTasks, onComplete, onAdd }: {
  openTasks: Task[]
  doneTasks: Task[]
  onComplete: (id: string) => void
  onAdd: (p: { title: string; priority: TaskPriority; category: TaskCategory; due_date: string }) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('high')
  const [newCategory, setNewCategory] = useState<TaskCategory>('delivery')
  const [newDue, setNewDue] = useState('')
  const [showDone, setShowDone] = useState(false)

  function handleAdd() {
    if (!newTitle.trim()) return
    onAdd({ title: newTitle.trim(), priority: newPriority, category: newCategory, due_date: newDue })
    setNewTitle(''); setNewDue(''); setShowAdd(false)
  }

  return (
    <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Add task */}
      {showAdd ? (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
              placeholder="Task title..."
              style={{ ...inputStyle, fontSize: '14px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value as TaskPriority)} style={{ ...selectStyle, flex: 1 }}>
                {TASK_PRIORITIES.map(p => <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>)}
              </select>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value as TaskCategory)} style={{ ...selectStyle, flex: 1 }}>
                {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleAdd} style={accentBtn}><Check size={13} /> Add</button>
              <button onClick={() => setShowAdd(false)} style={ghostBtn}><X size={13} /></button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
          background: 'var(--surface-1)', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px',
          width: '100%',
        }}>
          <Plus size={14} /> Add task
        </button>
      )}

      {/* Open tasks */}
      {openTasks.length === 0 && (
        <p style={{ fontSize: '13px', color: 'var(--text-faint)', padding: '20px 0', textAlign: 'center' }}>
          No open tasks. Nice work.
        </p>
      )}
      {openTasks.map(task => (
        <TaskRow key={task.id} task={task} onComplete={() => onComplete(task.id)} />
      ))}

      {/* Done tasks toggle */}
      {doneTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-faint)', fontSize: '12px',
            }}
          >
            <ChevronDown size={13} style={{ transform: showDone ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
            {doneTasks.length} completed
          </button>
          {showDone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {doneTasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: 'var(--radius)',
                  background: 'var(--surface-1)', border: '1px solid var(--border)', opacity: 0.5,
                }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--active)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 14px', borderRadius: 'var(--radius)',
      background: 'var(--surface-1)', border: '1px solid var(--border)',
    }}>
      <button
        onClick={onComplete}
        style={{
          width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
          border: '2px solid var(--border-strong)', background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 100ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--active)'; (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--active) 15%, transparent)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      />
      <span style={{
        fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
        color: PRIORITY_COLOR[task.priority],
        background: `color-mix(in srgb, ${PRIORITY_COLOR[task.priority]} 12%, transparent)`,
      }}>
        {TASK_PRIORITY_LABELS[task.priority]}
      </span>
      <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1 }}>{task.title}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-faint)', flexShrink: 0, textTransform: 'capitalize' }}>{task.category}</span>
      {task.due_date && (
        <span style={{ fontSize: '11px', color: 'var(--text-faint)', flexShrink: 0 }}>
          {formatDate(task.due_date)}
        </span>
      )}
    </div>
  )
}

// ─── Happy Dog Tab ────────────────────────────────────────────────────────────

function HappyDogTab({ orders, onStatusChange }: {
  orders: HappyDogOrder[]
  onStatusChange: (id: string, status: HappyDogStatus) => void
}) {
  if (orders.length === 0) {
    return <p style={{ fontSize: '13px', color: 'var(--text-faint)', padding: '20px 0', textAlign: 'center' }}>No Happy Dog orders yet.</p>
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Deliverable', 'Status', 'HD Cost', 'Your Price', 'Margin', 'Dates'].map(h => (
              <th key={h} style={{
                padding: '8px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 500,
                letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => {
            const margin = calcMargin(order.hd_cost ?? 0, order.client_price ?? 0)
            return (
              <tr key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <td style={{ padding: '12px 14px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{order.deliverable}</p>
                  {order.notes && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{order.notes}</p>}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <select
                    value={order.status}
                    onChange={e => onStatusChange(order.id, e.target.value as HappyDogStatus)}
                    style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                      border: `1px solid color-mix(in srgb, ${HD_STATUS_COLOR[order.status]} 30%, transparent)`,
                      background: `color-mix(in srgb, ${HD_STATUS_COLOR[order.status]} 10%, transparent)`,
                      color: HD_STATUS_COLOR[order.status], fontFamily: 'inherit',
                      outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {HD_STATUSES.map(s => <option key={s} value={s}>{HAPPYDOG_STATUS_LABELS[s]}</option>)}
                  </select>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="num" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {order.hd_cost ? formatCurrency(order.hd_cost) : '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="num" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    {order.client_price ? formatCurrency(order.client_price) : '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="num" style={{
                    fontSize: '13px', fontWeight: 700,
                    color: margin >= 50 ? 'var(--active)' : margin >= 30 ? 'var(--medium)' : 'var(--text-muted)',
                  }}>
                    {order.client_price ? `${margin}%` : '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.6 }}>
                    {order.ordered_date && <div>Ordered: {formatDate(order.ordered_date)}</div>}
                    {order.delivered_date && <div>Delivered: {formatDate(order.delivered_date)}</div>}
                    {!order.ordered_date && !order.delivered_date && '—'}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ activity, onLog }: {
  activity: ActivityLog[]
  onLog: (type: ActivityType, content: string) => Promise<void>
}) {
  const [type, setType] = useState<ActivityType>('note')
  const [content, setContent] = useState('')
  const [logging, setLogging] = useState(false)

  async function handleLog() {
    if (!content.trim()) return
    setLogging(true)
    await onLog(type, content.trim())
    setContent('')
    setLogging(false)
  }

  return (
    <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Log activity */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {ACTIVITY_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                border: '1px solid', cursor: 'pointer',
                background: type === t ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface-2)',
                color: type === t ? 'var(--accent)' : 'var(--text-muted)',
                borderColor: type === t ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`Log a ${type}...`}
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', fontSize: '13px', resize: 'vertical',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text)', fontFamily: 'inherit',
            outline: 'none', lineHeight: 1.5, boxSizing: 'border-box',
          }}
        />
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleLog} disabled={logging || !content.trim()} style={accentBtn}>
            <Plus size={13} /> {logging ? 'Logging...' : 'Log'}
          </button>
        </div>
      </div>

      {/* Timeline */}
      {activity.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>No activity logged yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activity.map(entry => {
            const Icon = ACTIVITY_ICONS[entry.type]
            return (
              <div key={entry.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>{entry.content}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '3px', textTransform: 'capitalize' }}>
                    {entry.type} · {formatDate(entry.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({ client, onSave }: { client: Client; onSave: (notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState(client.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(notes)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false) }}
        placeholder="Notes about this client..."
        rows={12}
        style={{
          width: '100%', padding: '14px 16px', fontSize: '14px', resize: 'vertical',
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', color: 'var(--text)', fontFamily: 'inherit',
          outline: 'none', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: '12px',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={handleSave} disabled={saving} style={accentBtn}>
          <Check size={13} /> {saving ? 'Saving...' : 'Save Notes'}
        </button>
        {saved && <span style={{ fontSize: '12px', color: 'var(--active)' }}>Saved</span>}
      </div>
    </div>
  )
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '8px' }}>
        {label}
      </p>
      <p className="num" style={{ fontSize: '24px', fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>{sub}</p>
    </div>
  )
}

function DetailRow({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  const content = value || <span style={{ color: 'var(--text-faint)' }}>—</span>
  return (
    <div>
      <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '3px' }}>
        {label}
      </p>
      {href ? (
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
          style={{ fontSize: '13px', color: 'var(--text)', textDecoration: 'none' }}>
          {content}
        </a>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text)' }}>{content}</p>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '5px' }}>{label}</p>
      {children}
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: '7px', color: 'var(--text)', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', cursor: 'pointer',
}

const accentBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
  background: 'var(--accent)', border: 'none',
  color: '#fff', cursor: 'pointer',
}
