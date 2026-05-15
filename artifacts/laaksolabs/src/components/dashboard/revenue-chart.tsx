import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { REVENUE_TARGET } from '@/lib/constants'
import { formatCurrencyShort } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface ChartDataPoint { month: string; div1: number; div2: number; div3: number; total: number }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: '10px', padding: '12px 14px', boxShadow: 'var(--shadow-elevated)' }}>
      <p className="label" style={{ marginBottom: '8px' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.name}</span>
          </div>
          <span className="num" style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{formatCurrencyShort(p.value)}</span>
        </div>
      ))}
      {total > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total MRR</span>
          <span className="num" style={{ fontSize: '13px', color: '#B42020', fontWeight: 600 }}>{formatCurrencyShort(total)}</span>
        </div>
      )}
    </div>
  )
}

export function RevenueChart({ data }: { data: ChartDataPoint[] }) {
  const hasData = data.some(d => d.total > 0)
  const maxVal = Math.max(...data.map(d => d.total), REVENUE_TARGET)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TrendingUp size={13} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Revenue Trend</h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paid MRR by division — last 6 months</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[{ label: 'Div 1', color: 'var(--div1)' }, { label: 'Div 2', color: 'var(--div2)' }, { label: 'Div 3', color: 'var(--div3)' }].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No revenue data yet</p>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Mark revenue entries as paid to see the chart</p>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {[['div1', '#6C6C70'], ['div2', '#8A78B4'], ['div3', '#6C6C70']].map(([id, color]) => (
                  <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatCurrencyShort(v as number)} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, maxVal * 1.1]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={REVENUE_TARGET} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Area type="monotone" dataKey="div1" stackId="1" stroke="#6C6C70" fill="url(#grad-div1)" strokeWidth={1.5} name="Div 1" />
              <Area type="monotone" dataKey="div2" stackId="1" stroke="#8A78B4" fill="url(#grad-div2)" strokeWidth={1.5} name="Div 2" />
              <Area type="monotone" dataKey="div3" stackId="1" stroke="#6C6C70" fill="url(#grad-div3)" strokeWidth={1.5} name="Div 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
