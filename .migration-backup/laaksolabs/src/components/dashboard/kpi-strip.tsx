import { TrendingUp, Users, Layers, AlertCircle } from 'lucide-react'
import { REVENUE_TARGET } from '@/lib/constants'
import { formatCurrency, formatCurrencyShort } from '@/lib/utils'

interface KpiStripProps {
  currentMRR: number
  activeClients: { div1: number; div2: number; div3: number }
  pipelineValue: number
  pipelineCount: number
  tasksDueToday: number
  tasksOverdue: number
}

export function KpiStrip({
  currentMRR,
  activeClients,
  pipelineValue,
  pipelineCount,
  tasksDueToday,
  tasksOverdue,
}: KpiStripProps) {
  const pct = Math.min((currentMRR / REVENUE_TARGET) * 100, 100)
  const totalActive = activeClients.div1 + activeClients.div2 + activeClients.div3
  const gap = REVENUE_TARGET - currentMRR

  return (
    <div
      className="kpi-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '28px',
      }}
    >
      {/* MRR — hero metric */}
      <div
        className="card animate-in delay-1"
        style={{
          padding: '24px',
          background: 'color-mix(in srgb, var(--accent) 4%, var(--surface-1))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="label">Monthly Revenue</span>
          <TrendingUp size={12} style={{ color: 'var(--accent)', opacity: 0.7 }} />
        </div>
        <p
          className="num"
          style={{
            fontSize: '44px', fontWeight: 700, lineHeight: 1,
            color: currentMRR > 0 ? 'var(--accent)' : 'var(--text)',
            letterSpacing: '-0.04em',
            marginBottom: '16px',
          }}
        >
          {formatCurrencyShort(currentMRR)}
        </p>
        <div
          style={{
            height: '3px', borderRadius: '2px',
            background: 'var(--border)', overflow: 'hidden',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              height: '100%', borderRadius: '2px',
              width: `${pct}%`,
              background: pct >= 80
                ? 'linear-gradient(90deg, var(--accent), var(--active))'
                : 'var(--accent)',
              boxShadow: pct > 0 ? '0 0 8px rgba(10,132,255,0.4)' : 'none',
              transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <span className="num" style={{ color: 'var(--accent)', fontWeight: 600 }}>{pct.toFixed(1)}%</span>
          {' of '}{formatCurrency(REVENUE_TARGET)}
          {gap > 0 && (
            <span style={{ color: 'var(--text-faint)' }}>
              {' · '}<span className="num">{formatCurrencyShort(gap)}</span> to go
            </span>
          )}
        </p>
      </div>

      {/* Active Clients */}
      <div className="card animate-in delay-2" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="label">Active Clients</span>
          <Users size={12} style={{ color: 'var(--text-faint)' }} />
        </div>
        <p
          className="num"
          style={{
            fontSize: '44px', fontWeight: 700, lineHeight: 1,
            color: 'var(--text)', letterSpacing: '-0.04em',
            marginBottom: '16px',
          }}
        >
          {totalActive}
        </p>
        <div style={{ display: 'flex', gap: '14px' }}>
          {[
            { label: 'D1', count: activeClients.div1, color: 'var(--div1)' },
            { label: 'D2', count: activeClients.div2, color: 'var(--div2)' },
            { label: 'D3', count: activeClients.div3, color: 'var(--div3)' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span className="num" style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{count}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="card animate-in delay-3" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="label">Pipeline Value</span>
          <Layers size={12} style={{ color: 'var(--text-faint)' }} />
        </div>
        <p
          className="num"
          style={{
            fontSize: '44px', fontWeight: 700, lineHeight: 1,
            color: pipelineValue > 0 ? 'var(--text)' : 'var(--text-faint)',
            letterSpacing: '-0.04em',
            marginBottom: '16px',
          }}
        >
          {formatCurrencyShort(pipelineValue)}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          <span className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>{pipelineCount}</span>
          {' '}prospect{pipelineCount !== 1 ? 's' : ''} in pipeline
        </p>
      </div>

      {/* Tasks */}
      <div className="card animate-in delay-4" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span className="label">Open Tasks</span>
          <AlertCircle size={12} style={{ color: 'var(--text-faint)' }} />
        </div>
        <p
          className="num"
          style={{
            fontSize: '44px', fontWeight: 700, lineHeight: 1,
            color: tasksOverdue > 0 ? 'var(--urgent)' : 'var(--text)',
            letterSpacing: '-0.04em',
            marginBottom: '16px',
          }}
        >
          {tasksDueToday + tasksOverdue}
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {tasksDueToday > 0 && (
            <span style={{
              fontSize: '11px', padding: '2px 7px', borderRadius: '4px', fontWeight: 500,
              background: 'color-mix(in srgb, var(--active) 12%, transparent)',
              color: 'var(--active)',
            }}>
              {tasksDueToday} due today
            </span>
          )}
          {tasksOverdue > 0 && (
            <span style={{
              fontSize: '11px', padding: '2px 7px', borderRadius: '4px', fontWeight: 600,
              background: 'color-mix(in srgb, var(--urgent) 14%, transparent)',
              color: 'var(--urgent)',
            }}>
              {tasksOverdue} overdue
            </span>
          )}
          {tasksDueToday === 0 && tasksOverdue === 0 && (
            <span style={{ fontSize: '11px', color: 'var(--active)' }}>All clear</span>
          )}
        </div>
      </div>
    </div>
  )
}
