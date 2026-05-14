'use client'

import { TrendingUp, Users, Layers, AlertTriangle } from 'lucide-react'
import { REVENUE_TARGET } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

interface MissionStripProps {
  currentMRR: number
  activeClients: { div1: number; div2: number; div3: number }
  pipelineValue: number
  tasksDueToday: number
  tasksOverdue: number
}

export function MissionStrip({
  currentMRR, activeClients, pipelineValue, tasksDueToday, tasksOverdue,
}: MissionStripProps) {
  const pct = Math.min((currentMRR / REVENUE_TARGET) * 100, 100)

  return (
    <div
      className="sticky top-0 z-10 animate-fade delay-0"
      style={{
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Accent progress rail */}
      <div style={{ height: '2px', background: 'var(--border)' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: pct >= 80
              ? 'linear-gradient(90deg, var(--accent), var(--active))'
              : 'var(--accent)',
            boxShadow: pct > 0 ? '0 0 8px rgba(10,132,255,0.5)' : 'none',
            transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Data rail */}
      <div className="mission-rail" style={{ display: 'flex', alignItems: 'stretch', minHeight: '60px' }}>

        {/* MRR */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            borderRight: '1px solid var(--border)',
            minWidth: '200px', padding: '0 24px',
          }}
        >
          <TrendingUp size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div>
            <p className="label" style={{ marginBottom: '2px' }}>MRR</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="num" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                {formatCurrency(currentMRR)}
              </span>
              <span className="num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                / {formatCurrency(REVENUE_TARGET)}
              </span>
            </div>
          </div>
        </div>

        {/* Active clients */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            borderRight: '1px solid var(--border)', padding: '0 24px',
          }}
        >
          <Users size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <div>
            <p className="label" style={{ marginBottom: '4px' }}>Active</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DivPill label="D1" count={activeClients.div1} color="var(--div1)" />
              <DivPill label="D2" count={activeClients.div2} color="var(--div2)" />
              <DivPill label="D3" count={activeClients.div3} color="var(--div3)" />
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            borderRight: '1px solid var(--border)', padding: '0 24px',
          }}
        >
          <Layers size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <div>
            <p className="label" style={{ marginBottom: '2px' }}>Pipeline</p>
            <span className="num" style={{ fontSize: '14px', fontWeight: 500, color: pipelineValue > 0 ? 'var(--text)' : 'var(--text-faint)' }}>
              {formatCurrency(pipelineValue)}
            </span>
          </div>
        </div>

        {/* Tasks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 24px' }}>
          <AlertTriangle
            size={12}
            style={{ color: tasksOverdue > 0 ? 'var(--urgent)' : 'var(--text-muted)', flexShrink: 0 }}
          />
          <div>
            <p className="label" style={{ marginBottom: '2px' }}>Today</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="num" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                {tasksDueToday}
              </span>
              {tasksOverdue > 0 && (
                <span
                  className="num"
                  style={{
                    fontSize: '10px', fontWeight: 600,
                    padding: '2px 6px', borderRadius: '5px',
                    background: 'color-mix(in srgb, var(--urgent) 14%, transparent)',
                    color: 'var(--urgent)',
                  }}
                >
                  {tasksOverdue} overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress — right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div style={{ textAlign: 'right' }}>
            <p className="label" style={{ marginBottom: '2px' }}>Progress</p>
            <span
              className="num"
              style={{
                fontSize: '17px', fontWeight: 600,
                color: pct >= 50 ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {pct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DivPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span className="num" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{count}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
