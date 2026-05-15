'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Client } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils'
import { DIVISION_LABELS, CLIENT_STATUS_LABELS } from '@/lib/constants'

const DIV_COLOR: Record<string, string> = {
  div1: 'var(--div1)',
  div2: 'var(--div2)',
  div3: 'var(--div3)',
}

export function ClientGrid({ clients }: { clients: Client[] }) {
  const visible = clients.filter(c => ['active', 'onboarding', 'proposal', 'lead'].includes(c.status))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '2px',
            }}
          >
            Client Roster
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {visible.filter(c => c.status === 'active' || c.status === 'onboarding').length} active
            {' · '}{clients.length} total
          </p>
        </div>
        <Link
          href="/clients"
          className="flex items-center gap-1 cursor-pointer"
          style={{ fontSize: '12px', color: 'var(--text-muted)', transition: 'color 120ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          All clients <ArrowRight size={11} />
        </Link>
      </div>

      {visible.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No active clients yet</p>
          <Link
            href="/clients"
            style={{ fontSize: '12px', color: 'var(--div1)', marginTop: '6px', display: 'inline-block' }}
          >
            Add your first client
          </Link>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
        >
          {visible.map((client, i) => {
            const divColor = DIV_COLOR[client.division] ?? 'var(--div1)'

            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="animate-in card card-hover block cursor-pointer rounded-xl"
                style={{
                  animationDelay: `${i * 55}ms`,
                  textDecoration: 'none',
                  padding: '20px',
                  borderTop: `2px solid color-mix(in srgb, ${divColor} 50%, transparent)`,
                  transition: 'border-color 120ms ease, background 120ms ease',
                }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p style={{
                      fontSize: '14px', fontWeight: 600,
                      color: 'var(--text)', letterSpacing: '-0.01em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {client.name}
                    </p>
                    {client.owner_name && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {client.owner_name}
                      </p>
                    )}
                  </div>
                  {/* Status dot */}
                  <div className={`dot dot-${client.status}`} style={{ marginTop: '3px' }} />
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`div-badge d${client.division.slice(-1)}`}>
                      {DIVISION_LABELS[client.division]}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {CLIENT_STATUS_LABELS[client.status]}
                    </span>
                  </div>
                  {client.retainer_amount ? (
                    <span
                      className="num font-semibold"
                      style={{ fontSize: '13px', color: 'var(--text)' }}
                    >
                      {formatCurrency(client.retainer_amount)}
                      <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>TBD</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
