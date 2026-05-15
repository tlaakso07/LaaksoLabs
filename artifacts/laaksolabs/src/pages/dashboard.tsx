import { useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { MissionStrip } from '@/components/dashboard/mission-strip'
import { KpiStrip } from '@/components/dashboard/kpi-strip'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TaskList } from '@/components/dashboard/task-list'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { ClientGrid } from '@/components/dashboard/client-grid'
import type { Client, Task } from '@/lib/supabase/types'
import { getFirstOfMonth, isOverdue, isDueToday } from '@/lib/utils'

interface DashboardData {
  clients: Client[]
  openTasks: Task[]
  recentActivity: Array<{ id: string; type: string; content: string; created_at: string; clients?: { name: string } | null }>
  chartData: Array<{ month: string; div1: number; div2: number; div3: number; total: number }>
  currentMRR: number
}

function monthLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
      <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'var(--border)', margin: '0 auto 8px' }} />
      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>Loading dashboard…</p>
    </div>
  )
}

function NotConfigured() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px', padding: '32px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚙</div>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Supabase not configured</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Add <code style={{ background: 'var(--surface-2)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>VITE_SUPABASE_URL</code> and{' '}
          <code style={{ background: 'var(--surface-2)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>VITE_SUPABASE_ANON_KEY</code>{' '}
          to the laaksolabs artifact environment, then restart.
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [configured] = useState(() => isSupabaseConfigured())

  useEffect(() => {
    if (!configured) return
    async function load() {
      try {
        const sb = createClient()
        const [{ data: clients }, { data: tasks }, { data: activity }, { data: revenues }] = await Promise.all([
          sb.from('clients').select('*').order('name'),
          sb.from('tasks').select('*').neq('status', 'done').order('created_at', { ascending: false }).limit(50),
          sb.from('activity_log').select('*, clients(name)').order('created_at', { ascending: false }).limit(12),
          sb.from('revenue_entries').select('*, clients(name, division)').eq('status', 'paid').order('month', { ascending: false }).limit(200),
        ])
        const clientList = (clients ?? []) as Client[]
        const taskList = (tasks ?? []) as Task[]
        const currentMonth = getFirstOfMonth()
        const currentMRR = (revenues ?? [])
          .filter((r: unknown) => (r as { month: string }).month === currentMonth)
          .reduce((s: number, r: unknown) => s + ((r as { amount: number }).amount ?? 0), 0)
        const months: string[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          months.push(getFirstOfMonth(d))
        }
        const chartData = months.map(m => {
          const me = (revenues ?? []).filter((r: unknown) => (r as { month: string }).month === m)
          type RE = { amount: number; clients: { division: string } | null }
          const rows = me as unknown as RE[]
          const div1 = rows.filter(r => r.clients?.division === 'div1').reduce((s, r) => s + r.amount, 0)
          const div2 = rows.filter(r => r.clients?.division === 'div2').reduce((s, r) => s + r.amount, 0)
          const div3 = rows.filter(r => r.clients?.division === 'div3').reduce((s, r) => s + r.amount, 0)
          return { month: monthLabel(m), div1, div2, div3, total: div1 + div2 + div3 }
        })
        setData({
          clients: clientList,
          openTasks: taskList,
          recentActivity: (activity ?? []) as DashboardData['recentActivity'],
          chartData,
          currentMRR,
        })
      } catch (err) {
        console.error('[dashboard] load failed:', err)
      }
    }
    load()
  }, [configured])

  if (!configured) return <NotConfigured />
  if (!data) return <LoadingState />

  const activeClients = {
    div1: data.clients.filter(c => c.status === 'active' && c.division === 'div1').length,
    div2: data.clients.filter(c => c.status === 'active' && c.division === 'div2').length,
    div3: data.clients.filter(c => c.status === 'active' && c.division === 'div3').length,
  }
  const pipelineValue = data.clients.filter(c => ['lead', 'proposal'].includes(c.status)).reduce((s, c) => s + (c.retainer_amount ?? 0), 0)
  const pipelineCount = data.clients.filter(c => ['lead', 'proposal'].includes(c.status)).length
  const tasksDueToday = data.openTasks.filter(t => isDueToday(t.due_date)).length
  const tasksOverdue = data.openTasks.filter(t => isOverdue(t.due_date)).length

  const prioritizedTasks = [...data.openTasks]
    .filter(t => t.due_date && (isDueToday(t.due_date) || isOverdue(t.due_date)))
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
    .slice(0, 12)

  return (
    <div className="page-fade" style={{ height: '100%', overflow: 'auto' }}>
      <MissionStrip currentMRR={data.currentMRR} activeClients={activeClients} pipelineValue={pipelineValue} tasksDueToday={tasksDueToday} tasksOverdue={tasksOverdue} />
      <div className="page-pad" style={{ padding: '28px 32px' }}>
        <KpiStrip currentMRR={data.currentMRR} activeClients={activeClients} pipelineValue={pipelineValue} pipelineCount={pipelineCount} tasksDueToday={tasksDueToday} tasksOverdue={tasksOverdue} />
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '28px', minHeight: '340px' }}>
          <div className="card animate-in delay-5" style={{ padding: '24px' }}><RevenueChart data={data.chartData} /></div>
          <div className="card animate-in delay-6" style={{ padding: '24px' }}><TaskList initialTasks={prioritizedTasks} /></div>
        </div>
        <div className="animate-in delay-7" style={{ marginBottom: '28px' }}>
          <ClientGrid clients={data.clients} />
        </div>
        <div className="card animate-in delay-8" style={{ padding: '24px' }}>
          <ActivityFeed entries={data.recentActivity} />
        </div>
      </div>
    </div>
  )
}
