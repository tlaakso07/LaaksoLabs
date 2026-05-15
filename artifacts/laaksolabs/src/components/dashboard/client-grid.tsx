import { Link } from 'wouter'
import { ArrowRight } from 'lucide-react'
import type { Client } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils'
import { DIVISION_LABELS, CLIENT_STATUS_LABELS } from '@/lib/constants'

const DIV_COLOR: Record<string, string> = { div1: 'var(--div1)', div2: 'var(--div2)', div3: 'var(--div3)' }

export function ClientGrid({ clients }: { clients: Client[] }) {
  const visible = clients.filter(c => ['active', 'onboarding', 'proposal', 'lead'].includes(c.status))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: '2px' }}>Client Roster</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {visible.filter(c => c.status === 'active' || c.status === 'onboarding').length} active · {clients.length} total
          </p>
        </div>
        <Link href="/clients" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 120ms ease', cursor: 'pointer' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          All clients <ArrowRight size={11} />
        </Link>
      </div>
      {visible.length === 0 ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No active clients yet</p>
          <Link href="/clients" style={{ fontSize: '12px', color: 'var(--div1)', marginTop: '6px', display: 'inline-block', textDecoration: 'none' }}>Add your first client</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {visible.map((client, i) => {
            const divColor = DIV_COLOR[client.division] ?? 'var(--div1)'
            return (
              <Link key={client.id} href={`/clients/${client.id}`}
                className="animate-in card card-hover"
                style={{ animationDelay: `${i * 55}ms`, display: 'block', textDecoration: 'none', padding: '20px', borderRadius: '12px', borderTop: `2px solid color-mix(in srgb, ${divColor} 50%, transparent)`, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</p>
                    {client.owner_name && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{client.owner_name}</p>}
                  </div>
                  <div className={`dot dot-${client.status}`} style={{ marginTop: '3px', flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`div-badge d${client.division.slice(-1)}`}>{DIVISION_LABELS[client.division]}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{CLIENT_STATUS_LABELS[client.status]}</span>
                  </div>
                  {client.retainer_amount
                    ? <span className="num" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{formatCurrency(client.retainer_amount)}<span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span></span>
                    : <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>TBD</span>
                  }
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
