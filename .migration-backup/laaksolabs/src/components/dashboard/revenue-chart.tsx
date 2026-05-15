'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { REVENUE_TARGET } from '@/lib/constants'
import { formatCurrencyShort } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface ChartDataPoint {
  month: string
  div1: number
  div2: number
  div3: number
  total: number
}

interface TooltipEntry {
  dataKey: string
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-strong)',
        borderRadius: '10px',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-elevated)',
      }}
    >
      <p className="label" style={{ marginBottom: '8px' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-8" style={{ marginBottom: '3px' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.name}</span>
          </div>
          <span className="num font-medium" style={{ fontSize: '12px', color: 'var(--text)' }}>
            {formatCurrencyShort(p.value)}
          </span>
        </div>
      ))}
      {total > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            marginTop: '8px',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total MRR</span>
          <span className="num font-semibold" style={{ fontSize: '13px', color: '#B42020' }}>
            {formatCurrencyShort(total)}
          </span>
        </div>
      )}
    </div>
  )
}

export function RevenueChart({ data }: { data: ChartDataPoint[] }) {
  const hasData = data.some(d => d.total > 0)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
              marginBottom: '2px',
            }}
          >
            Revenue Trend
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>6-month MRR by division</p>
        </div>
        <div className="flex items-center gap-4">
          {[
            { color: 'var(--div1)', label: 'Marketing' },
            { color: 'var(--div2)', label: 'Consulting' },
            { color: 'var(--div3)', label: 'Fund' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div style={{ width: '14px', height: '1px', background: '#B42020', borderTop: '1px dashed #B42020' }} />
            <span style={{ fontSize: '11px', color: '#B42020' }}>$200K target</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-3"
          style={{ minHeight: 0 }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={17} style={{ color: 'var(--text-faint)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
              No revenue recorded yet
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
              Mark invoices as paid to start tracking MRR
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
              <defs>
                {[
                  { id: 'div1', color: '#5A8EC6' },
                  { id: 'div2', color: '#8A78B4' },
                  { id: 'div3', color: '#B08C52' },
                ].map(({ id, color }) => (
                  <linearGradient key={id} id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-geist-mono)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-geist-mono)' }}
                axisLine={false} tickLine={false}
                tickFormatter={formatCurrencyShort}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} />
              <ReferenceLine
                y={REVENUE_TARGET}
                stroke="#B42020"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{ value: '$200K', position: 'insideTopRight', fill: '#B42020', fontSize: 10, fontFamily: 'var(--font-geist-mono)', dy: -4 }}
              />
              <Area type="monotone" dataKey="div1" name="Marketing" stackId="1" stroke="#5A8EC6" strokeWidth={1.5} fill="url(#g-div1)" />
              <Area type="monotone" dataKey="div2" name="Consulting" stackId="1" stroke="#8A78B4" strokeWidth={1.5} fill="url(#g-div2)" />
              <Area type="monotone" dataKey="div3" name="Fund" stackId="1" stroke="#B08C52" strokeWidth={1.5} fill="url(#g-div3)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
