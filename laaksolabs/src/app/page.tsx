import { createAdminClient } from '@/lib/supabase/server'
import { MissionStrip } from '@/components/dashboard/mission-strip'
import { KpiStrip } from '@/components/dashboard/kpi-strip'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TaskList } from '@/components/dashboard/task-list'
import { ClientGrid } from '@/components/dashboard/client-grid'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { getFirstOfMonth } from '@/lib/utils'

async function getDashboard() {
  const db = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [clientsRes, tasksRes, activityRes] = await Promise.all([
    db.from('clients').select('*').order('name'),
    db.from('tasks').select('*').neq('status', 'done').lte('due_date', today).order('priority'),
    db.from('activity_log').select('*, clients(name)').order('created_at', { ascending: false }).limit(15),
  ])

  const clients = clientsRes.data ?? []
  const tasks   = tasksRes.data ?? []
  const activity = activityRes.data ?? []

  const activeClients  = clients.filter(c => c.status === 'active')
  const currentMRR     = activeClients.reduce((s, c) => s + (c.retainer_amount ?? 0), 0)

  const pipelineClients = clients.filter(c => ['lead', 'proposal'].includes(c.status))
  const pipelineValue   = pipelineClients.reduce((s, c) => s + (c.retainer_amount ?? 0), 0)
  const pipelineCount   = pipelineClients.length

  const chartData = await buildChart(db)

  return {
    clients,
    tasks,
    activity,
    currentMRR,
    activeClients: {
      div1: activeClients.filter(c => c.division === 'div1').length,
      div2: activeClients.filter(c => c.division === 'div2').length,
      div3: activeClients.filter(c => c.division === 'div3').length,
    },
    pipelineValue,
    pipelineCount,
    tasksDueToday: tasks.filter(t => t.due_date === today).length,
    tasksOverdue:  tasks.filter(t => t.due_date && t.due_date < today).length,
    chartData,
  }
}

async function buildChart(db: ReturnType<typeof createAdminClient>) {
  const rows = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const month = getFirstOfMonth(d)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const { data } = await db
      .from('revenue_entries')
      .select('amount, clients(division)')
      .eq('month', month)
      .eq('status', 'paid')
    const e = data ?? []
    type RevenueRow = { amount: number; clients: { division: string } | null }
    const byDiv = (div: string) =>
      (e as unknown as RevenueRow[]).filter(r => r.clients?.division === div).reduce((s, r) => s + r.amount, 0)
    rows.push({
      month: label,
      div1: byDiv('div1'),
      div2: byDiv('div2'),
      div3: byDiv('div3'),
      total: byDiv('div1') + byDiv('div2') + byDiv('div3'),
    })
  }
  return rows
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDateLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const data = await getDashboard()

  return (
    <div className="flex flex-col h-full">
      <MissionStrip
        currentMRR={data.currentMRR}
        activeClients={data.activeClients}
        pipelineValue={data.pipelineValue}
        tasksDueToday={data.tasksDueToday}
        tasksOverdue={data.tasksOverdue}
      />

      <div className="flex-1 overflow-auto">
        <div className="page-pad" style={{ padding: '28px 32px', maxWidth: '1600px' }}>

          {/* Greeting */}
          <div className="animate-fade delay-0" style={{ marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                marginBottom: '4px',
              }}
            >
              {getGreeting()}, Trevor
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {getDateLabel()}
            </p>
          </div>

          {/* KPI Hero Strip */}
          <KpiStrip
            currentMRR={data.currentMRR}
            activeClients={data.activeClients}
            pipelineValue={data.pipelineValue}
            pipelineCount={data.pipelineCount}
            tasksDueToday={data.tasksDueToday}
            tasksOverdue={data.tasksOverdue}
          />

          {/* Two-column layout: main content + right activity panel */}
          <div
            className="dashboard-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 380px',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Left — chart + client roster */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                className="card animate-in delay-2"
                style={{ padding: '24px', height: '380px' }}
              >
                <RevenueChart data={data.chartData} />
              </div>

              <div className="animate-in delay-3">
                <ClientGrid clients={data.clients} />
              </div>
            </div>

            {/* Right — tasks + activity feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                className="card animate-in delay-2"
                style={{ padding: '20px' }}
              >
                <TaskList initialTasks={data.tasks} />
              </div>

              <div
                className="card animate-in delay-3"
                style={{ padding: '20px' }}
              >
                <ActivityFeed entries={data.activity} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
