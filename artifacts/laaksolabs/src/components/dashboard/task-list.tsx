import { useState, useTransition } from 'react'
import { Check, CheckCircle2 } from 'lucide-react'
import type { Task } from '@/lib/supabase/types'
import { completeTask } from '@/lib/supabase/queries/tasks'
import { isOverdue } from '@/lib/utils'
import { useRealtimeTable } from '@/hooks/use-realtime-table'

const PRIORITY_COLOR: Record<string, string> = { urgent: 'var(--urgent)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' }

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useRealtimeTable<Task>('tasks', initialTasks)
  const [completing, setComp] = useState<string | null>(null)
  const [, startTx] = useTransition()

  const handleComplete = (id: string) => {
    setComp(id)
    startTx(async () => {
      try {
        await completeTask(id)
        setTasks(prev => prev.filter(t => t.id !== id))
      } finally { setComp(null) }
    })
  }

  const active = tasks.filter(t => t.status !== 'done')

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '2px' }}>Today's Priorities</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{active.length === 0 ? 'All clear' : `${active.length} remaining`}</p>
        </div>
        <div className="flex items-center gap-1.5" title="Live updates">
          <span className="live-dot" />
          <span style={{ fontSize: '10px', color: 'var(--active)', fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
        </div>
      </div>
      {active.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'color-mix(in srgb, var(--active) 10%, var(--surface-2))', border: '1px solid color-mix(in srgb, var(--active) 25%, var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--active)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>All caught up</p>
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '3px' }}>No tasks due today.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {active.map((task, i) => {
            const overdue = isOverdue(task.due_date)
            const color = PRIORITY_COLOR[task.priority] ?? 'var(--low)'
            const done = completing === task.id
            return (
              <div key={task.id} className="animate-in" style={{ animationDelay: `${i * 45}ms`, opacity: done ? 0.35 : 1, transition: 'opacity 0.2s ease' }}>
                <div className="group flex items-start gap-3 cursor-pointer rounded-lg -mx-2" style={{ padding: '8px 8px', transition: 'background 100ms ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <button onClick={() => handleComplete(task.id)} disabled={!!completing} className="mt-0.5 shrink-0 cursor-pointer"
                    style={{ width: '17px', height: '17px', borderRadius: '50%', border: `1.5px solid ${done ? 'var(--active)' : color}`, background: done ? 'var(--active)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
                  >
                    {done && <Check size={9} color="white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '14px', lineHeight: '1.4', color: overdue ? 'var(--urgent)' : 'var(--text)', marginBottom: '3px' }}>{task.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`priority-chip ${task.priority}`}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                        {task.priority}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'capitalize' }}>{task.category}</span>
                      {overdue && <span style={{ fontSize: '11px', color: 'var(--urgent)', fontWeight: 500 }}>overdue</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
