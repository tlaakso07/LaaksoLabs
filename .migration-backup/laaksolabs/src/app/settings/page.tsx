'use client'

import { useState } from 'react'
import {
  Settings, Building2, Target, Layers,
  Keyboard, Database, Check, RotateCcw,
} from 'lucide-react'
import { REVENUE_TARGET, DIVISION_FULL_LABELS, DIVISION_TARGET_RETAINER } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { Division } from '@/lib/supabase/types'

const LS_KEY_TARGET = 'laakso_revenue_target'
const LS_KEY_COMPANY = 'laakso_company_settings'

const DIVISIONS: Division[] = ['div1', 'div2', 'div3']

const DIV_STYLE: Record<Division, { color: string; cssVar: string }> = {
  div1: { color: '#6C6C70', cssVar: 'var(--div1)' },
  div2: { color: '#8A78B4', cssVar: 'var(--div2)' },
  div3: { color: '#6C6C70', cssVar: 'var(--div3)' },
}

const DIV_BADGE_CLASS: Record<Division, string> = {
  div1: 'div-badge d1',
  div2: 'div-badge d2',
  div3: 'div-badge d3',
}

const SHORTCUTS = [
  { keys: ['⌘', 'K'],     action: 'Open command palette — search pages, clients, tasks' },
  { keys: ['N'],           action: 'Quick-add task from anywhere (blocked when typing)' },
  { keys: ['⌘', '↵'],     action: 'Save / confirm in modals & quick-add task' },
  { keys: ['↑', '↓'],     action: 'Navigate results in command palette' },
  { keys: ['↵'],           action: 'Open selected result in command palette' },
  { keys: ['Esc'],         action: 'Close modal, palette, or cancel edit' },
]

const STACK = [
  { label: 'Framework',  value: 'Next.js 14 (App Router)' },
  { label: 'Styling',    value: 'Tailwind CSS + shadcn/ui' },
  { label: 'Database',   value: 'Supabase (PostgreSQL)' },
  { label: 'Charts',     value: 'Recharts' },
  { label: 'Hosting',    value: 'Vercel' },
  { label: 'Package Mgr',value: 'pnpm' },
]

interface CompanySettings {
  name: string
  tagline: string
  founder: string
  website: string
}

const DEFAULT_COMPANY: CompanySettings = {
  name: 'Laakso Labs',
  tagline: 'AI-Powered Services & Consulting',
  founder: 'Trevor Laakso',
  website: 'laaksolabs.com',
}

function readLS<T>(key: string, fallback: T, parse?: (v: string) => T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    if (!v) return fallback
    return parse ? parse(v) : v as unknown as T
  } catch { return fallback }
}

export default function SettingsPage() {
  const [revenueTarget, setRevenueTarget] = useState(() => readLS(LS_KEY_TARGET, REVENUE_TARGET, Number))
  const [targetInput, setTargetInput] = useState(() => readLS(LS_KEY_TARGET, String(REVENUE_TARGET)))
  const [company, setCompany] = useState<CompanySettings>(() => readLS(LS_KEY_COMPANY, DEFAULT_COMPANY, v => JSON.parse(v) as CompanySettings))
  const [companyEdit, setCompanyEdit] = useState<CompanySettings>(() => readLS(LS_KEY_COMPANY, DEFAULT_COMPANY, v => JSON.parse(v) as CompanySettings))
  const [editingCompany, setEditingCompany] = useState(false)
  const [savedTarget, setSavedTarget] = useState(false)
  const [savedCompany, setSavedCompany] = useState(false)

  function saveTarget() {
    const val = parseInt(targetInput.replace(/\D/g, ''), 10)
    if (!val || val < 1000) return
    localStorage.setItem(LS_KEY_TARGET, String(val))
    setRevenueTarget(val)
    setSavedTarget(true)
    setTimeout(() => setSavedTarget(false), 2000)
  }

  function saveCompany() {
    localStorage.setItem(LS_KEY_COMPANY, JSON.stringify(companyEdit))
    setCompany(companyEdit)
    setEditingCompany(false)
    setSavedCompany(true)
    setTimeout(() => setSavedCompany(false), 2000)
  }

  function resetTarget() {
    localStorage.removeItem(LS_KEY_TARGET)
    setRevenueTarget(REVENUE_TARGET)
    setTargetInput(String(REVENUE_TARGET))
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-in delay-0" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Settings size={18} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Settings</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
          Company info, revenue targets, and app configuration
        </p>
      </div>

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* ── Left column ───────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Company Info */}
          <section className="card animate-in delay-1" style={{ padding: '20px 24px' }}>
            <SectionHeader icon={<Building2 size={14} style={{ color: 'var(--accent)' }} />} title="Company Info">
              {editingCompany ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveCompany} style={btnPrimary}>
                    <Check size={11} /> Save
                    {savedCompany && ' ✓'}
                  </button>
                  <button onClick={() => { setEditingCompany(false); setCompanyEdit(company) }} style={btnGhost}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setEditingCompany(true)} style={btnGhost}>Edit</button>
              )}
            </SectionHeader>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
              {(['name', 'tagline', 'founder', 'website'] as (keyof CompanySettings)[]).map(key => (
                <div key={key}>
                  <label className="label" style={{ display: 'block', marginBottom: 5 }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </label>
                  <input
                    value={companyEdit[key]}
                    readOnly={!editingCompany}
                    onChange={e => setCompanyEdit(c => ({ ...c, [key]: e.target.value }))}
                    style={{
                      ...inputStyle,
                      background: editingCompany ? 'var(--surface-2)' : 'transparent',
                      border: editingCompany ? '1px solid var(--border)' : '1px solid transparent',
                      cursor: editingCompany ? 'text' : 'default',
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Revenue Target */}
          <section className="card animate-in delay-2" style={{ padding: '20px 24px' }}>
            <SectionHeader icon={<Target size={14} style={{ color: 'var(--accent)' }} />} title="Revenue Target" />

            <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>Monthly Recurring Revenue Target</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-geist-mono)',
                  }}>$</span>
                  <input
                    type="text"
                    value={targetInput}
                    onChange={e => setTargetInput(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 22 }}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Affects the sidebar MRR bar and dashboard progress — reload after saving.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 28 }}>
                <button
                  onClick={saveTarget}
                  style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {savedTarget ? <><Check size={11} /> Saved</> : 'Save'}
                </button>
                {revenueTarget !== REVENUE_TARGET && (
                  <button onClick={resetTarget} style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <RotateCcw size={10} /> Reset
                  </button>
                )}
              </div>
            </div>

            <div style={{
              marginTop: 16, padding: '14px 16px',
              background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              display: 'flex', gap: 32,
            }}>
              <Stat label="Current Target" value={formatCurrency(revenueTarget)} />
              <Stat label="Default" value={formatCurrency(REVENUE_TARGET)} muted={revenueTarget === REVENUE_TARGET} />
              <Stat label="Formula" value="7 Div1 + 6 Div2 + Projects + Other" small />
            </div>
          </section>

          {/* Division Setup */}
          <section className="card animate-in delay-3" style={{ padding: '20px 24px' }}>
            <SectionHeader icon={<Layers size={14} style={{ color: 'var(--accent)' }} />} title="Division Configuration" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
              {DIVISIONS.map(div => (
                <div key={div} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 140px 120px',
                  alignItems: 'center', gap: 16,
                  padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                }}>
                  <span className={DIV_BADGE_CLASS[div]} style={{ justifySelf: 'start' }}>
                    {div.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                    {DIVISION_FULL_LABELS[div]}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: DIV_STYLE[div].cssVar,
                    }} />
                    <span className="num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {DIV_STYLE[div].color}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="label" style={{ display: 'block' }}>Target Retainer</span>
                    <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2, display: 'block' }}>
                      {DIVISION_TARGET_RETAINER[div] > 0 ? formatCurrency(DIVISION_TARGET_RETAINER[div]) + '/mo' : 'Equity'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
              Division colors and target retainers are defined in <code style={{ background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>src/lib/constants.ts</code>
            </p>
          </section>

        </div>

        {/* ── Right column ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tech Stack */}
          <section className="card animate-in delay-2" style={{ padding: '20px 24px' }}>
            <SectionHeader icon={<Database size={14} style={{ color: 'var(--accent)' }} />} title="Tech Stack" />

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {STACK.map(({ label, value }, i) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 0',
                  borderBottom: i < STACK.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <span className="label">{label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: 170 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="card animate-in delay-3" style={{ padding: '20px 24px' }}>
            <SectionHeader icon={<Keyboard size={14} style={{ color: 'var(--accent)' }} />} title="Keyboard Shortcuts" />

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SHORTCUTS.map(({ keys, action }) => (
                <div key={action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action}</span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {keys.map((k, i) => (
                      <span key={i} style={{
                        padding: '2px 6px', borderRadius: 4,
                        background: 'var(--surface-3)', border: '1px solid var(--border-strong)',
                        fontSize: 10, fontFamily: 'var(--font-geist-mono)',
                        color: 'var(--text-muted)', lineHeight: 1.6,
                      }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* App Version */}
          <section className="card animate-in delay-4" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label">Version</span>
                <span className="num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>0.2.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label">Phase</span>
                <span style={{ fontSize: 11, color: 'var(--active)', fontWeight: 600 }}>2 — Core Features</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label">Build</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>2026-05-13</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  icon, title, children,
}: {
  icon: React.ReactNode; title: string; children?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, muted, small }: { label: string; value: string; muted?: boolean; small?: boolean }) {
  return (
    <div>
      <span className="label" style={{ display: 'block', marginBottom: 3 }}>{label}</span>
      <span className="num" style={{
        fontSize: small ? 11 : 14, fontWeight: 700,
        color: muted ? 'var(--text-muted)' : 'var(--text)',
      }}>
        {value}
      </span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12, outline: 'none',
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '7px 14px', background: 'var(--accent)',
  border: 'none', borderRadius: 'var(--radius-sm)',
  color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '7px 12px', background: 'transparent',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
  whiteSpace: 'nowrap',
}
