'use client'

import { Phone, Mail, FileText, Users, Star, DollarSign } from 'lucide-react'
import { useRealtimeTable } from '@/hooks/use-realtime-table'

interface ActivityEntry {
  id: string
  type: string
  content: string
  created_at: string
  clients?: { name: string } | null
}

const ICON_MAP: Record<string, React.ReactNode> = {
  call:      <Phone size={10} />,
  email:     <Mail size={10} />,
  note:      <FileText size={10} />,
  meeting:   <Users size={10} />,
  milestone: <Star size={10} />,
  payment:   <DollarSign size={10} />,
}

const TYPE_COLOR: Record<string, string> = {
  call:      'var(--div1)',
  email:     'var(--div2)',
  note:      'var(--text-muted)',
  meeting:   'var(--div3)',
  milestone: 'var(--gold)',
  payment:   'var(--active)',
}

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export function ActivityFeed({ entries: initialEntries }: { entries: ActivityEntry[] }) {
  const [entries] = useRealtimeTable<ActivityEntry>('activity_log', initialEntries)

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
            Recent Activity
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Across all clients</p>
        </div>
        <div className="flex items-center gap-1.5" title="Live updates">
          <span className="live-dot" />
          <span style={{ fontSize: '10px', color: 'var(--active)', fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No activity yet</p>
          <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
            Log calls, emails, and milestones from client pages
          </p>
        </div>
      ) : (
        <div>
          {entries.map((entry, i) => {
            const color = TYPE_COLOR[entry.type] ?? 'var(--text-muted)'
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 py-2.5"
                style={{
                  borderBottom: i < entries.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '24px', height: '24px', borderRadius: '7px',
                    background: `color-mix(in srgb, ${color} 12%, var(--surface-2))`,
                    color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: '1px',
                  }}
                >
                  {ICON_MAP[entry.type] ?? <FileText size={10} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.4 }}>
                    {entry.content}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.clients?.name && (
                      <span style={{ fontSize: '11px', color: 'var(--div1)' }}>
                        {entry.clients.name}
                      </span>
                    )}
                    <span className="num" style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                      {timeAgo(entry.created_at)} ago
                    </span>
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
