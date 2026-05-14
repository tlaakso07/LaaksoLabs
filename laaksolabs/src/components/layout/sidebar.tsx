'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, CheckSquare,
  Package, DollarSign, BookUser, Settings, Zap,
} from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { REVENUE_TARGET } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard',  href: '/',          icon: LayoutDashboard },
  { label: 'Clients',    href: '/clients',   icon: Users },
  { label: 'Tasks',      href: '/tasks',     icon: CheckSquare },
  { label: 'Happy Dog',  href: '/happydog',  icon: Package },
  { label: 'Revenue',    href: '/revenue',   icon: DollarSign },
  { label: 'Contacts',   href: '/contacts',  icon: BookUser },
  { label: 'Settings',   href: '/settings',  icon: Settings },
]

const BOTTOM_NAV = [
  { label: 'Home',      href: '/',          icon: LayoutDashboard },
  { label: 'Clients',   href: '/clients',   icon: Users },
  { label: 'Tasks',     href: '/tasks',     icon: CheckSquare },
  { label: 'Happy Dog', href: '/happydog',  icon: Package },
  { label: 'Revenue',   href: '/revenue',   icon: DollarSign },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="bottom-nav" style={{ display: 'none', justifyContent: 'space-around', alignItems: 'center' }}>
      {BOTTOM_NAV.map(({ label, href, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '8px 4px', textDecoration: 'none', flex: 1,
              color: active ? 'var(--sidebar-accent)' : 'var(--sidebar-text-dim)',
            }}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.5} />
            <span style={{ fontSize: '9px', fontWeight: active ? 600 : 400, letterSpacing: '0.03em' }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({ currentMRR = 0 }: { currentMRR?: number }) {
  const pathname = usePathname()
  const pct = Math.min((currentMRR / REVENUE_TARGET) * 100, 100)
  const gap = REVENUE_TARGET - currentMRR

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        transition: 'background 180ms ease, border-color 180ms ease',
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          minHeight: '64px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--sidebar-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'var(--sidebar-card)',
              border: '1px solid var(--sidebar-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={13} strokeWidth={2} style={{ color: 'var(--sidebar-accent)' }} />
          </div>
          <div>
            <p style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--sidebar-text)',
              letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>
              Laakso Labs
            </p>
            <p style={{
              fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--sidebar-text-dim)',
              marginTop: '2px',
            }}>
              Command Center
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <p style={{
          fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--sidebar-text-faint)',
          padding: '0 10px', marginBottom: '8px',
        }}>
          Navigation
        </p>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--sidebar-text)' : 'var(--sidebar-text-dim)',
                background: active ? 'var(--sidebar-active)' : 'transparent',
                borderLeft: `2px solid ${active ? 'var(--sidebar-accent)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'background 100ms ease, color 100ms ease',
                marginBottom: '2px',
              }}
              onMouseEnter={e => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'var(--sidebar-hover)'
                  el.style.color = 'var(--sidebar-text)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = 'var(--sidebar-text-dim)'
                }
              }}
            >
              <Icon
                size={14}
                strokeWidth={active ? 2 : 1.5}
                style={{
                  color: 'var(--sidebar-accent)',
                  flexShrink: 0,
                }}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Separator */}
      <div style={{ height: '1px', background: 'var(--sidebar-border)', margin: '0 12px' }} />

      {/* MRR Progress */}
      <div
        style={{
          margin: '12px',
          padding: '16px',
          borderRadius: '12px',
          background: 'var(--sidebar-card)',
          border: '1px solid var(--sidebar-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--sidebar-text-dim)',
          }}>
            MRR Target
          </span>
          <span className="num" style={{ fontSize: '11px', color: 'var(--sidebar-accent)', fontWeight: 600 }}>
            {pct.toFixed(1)}%
          </span>
        </div>

        <div style={{
          height: '3px', borderRadius: '2px',
          background: 'var(--sidebar-track)', overflow: 'hidden', marginBottom: '10px',
        }}>
          <div
            style={{
              height: '100%', borderRadius: '2px',
              width: `${pct}%`,
              background: 'var(--sidebar-accent)',
              opacity: pct >= 100 ? 1 : 0.85,
              transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="num" style={{ fontSize: '13px', color: 'var(--sidebar-text)', fontWeight: 600 }}>
            {formatCurrency(currentMRR)}
          </span>
          <span className="num" style={{ fontSize: '11px', color: 'var(--sidebar-text-faint)' }}>
            {gap > 0 ? `${formatCurrency(gap)} to go` : 'Target met'}
          </span>
        </div>
      </div>
    </aside>
  )
}
