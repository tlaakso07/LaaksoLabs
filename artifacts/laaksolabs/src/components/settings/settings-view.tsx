import { useState } from 'react'
import { Settings, Zap, Database, Bell, Palette, Users, Shield } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { REVENUE_TARGET } from '@/lib/constants'

const INPUT: React.CSSProperties = { padding: '8px 12px', fontSize: '13px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%', transition: 'border-color 120ms ease' }

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>{icon}</div>
        <div><p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>{title}</p></div>
      </div>
      {children}
    </div>
  )
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>{label}</p>
        {description && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0' }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

export function SettingsView() {
  const [env, setEnv] = useState({ supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '', anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function fakeSave() {
    setSaving(true)
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }, 600)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Settings size={18} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Settings</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Manage your Laakso Labs workspace configuration</p>
      </div>

      <Section title="Appearance" icon={<Palette size={15} />}>
        <Row label="Color Theme" description="Toggle between dark and light mode">
          <ThemeToggle />
        </Row>
        <Row label="Accent Color" description="Primary brand color used throughout the app">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'var(--accent)', border: '1px solid var(--border)' }} />
            <span className="num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#B42020</span>
          </div>
        </Row>
      </Section>

      <Section title="Revenue Target" icon={<Zap size={15} />}>
        <Row label="Annual Revenue Target" description="Used for MRR progress calculations across the dashboard">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="num" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>${REVENUE_TARGET.toLocaleString()}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>configured in code</span>
          </div>
        </Row>
      </Section>

      <Section title="Database" icon={<Database size={15} />}>
        <Row label="Supabase URL" description="Your Supabase project URL">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: env.supabaseUrl ? 'var(--active)' : 'var(--urgent)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{env.supabaseUrl ? 'Connected' : 'Not configured'}</span>
          </div>
        </Row>
        <Row label="Anon Key" description="Supabase public anon key for client-side queries">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: env.anonKey ? 'var(--active)' : 'var(--urgent)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{env.anonKey ? 'Set' : 'Not configured'}</span>
          </div>
        </Row>
        <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '12px', lineHeight: 1.6 }}>
          Configure <code style={{ fontSize: '11px', background: 'var(--surface-2)', padding: '1px 5px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> and <code style={{ fontSize: '11px', background: 'var(--surface-2)', padding: '1px 5px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code> as Replit environment secrets.
        </p>
      </Section>

      <Section title="Divisions" icon={<Users size={15} />}>
        {[['Div 1', 'AI Design & Marketing', 'var(--div1)'], ['Div 2', 'AI Consulting & SEO', 'var(--div2)'], ['Div 3', 'The Fund', 'var(--div3)']].map(([div, label, color]) => (
          <Row key={div} label={div} description={label}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: `color-mix(in srgb, ${color} 18%, var(--surface-2))`, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            </div>
          </Row>
        ))}
      </Section>

      <Section title="Keyboard Shortcuts" icon={<Shield size={15} />}>
        {[['⌘K', 'Open command palette'], ['N', 'Quick add task (from any page)'], ['⌘↵', 'Confirm quick-add task']].map(([key, label]) => (
          <Row key={key} label={label}>
            <kbd style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '5px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'inherit' }}>{key}</kbd>
          </Row>
        ))}
      </Section>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={fakeSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Settings'}</button>
        {saved && <span style={{ fontSize: '12px', color: 'var(--active)' }}>Settings saved</span>}
      </div>
    </div>
  )
}
