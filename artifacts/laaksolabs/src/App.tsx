import { useState, useEffect, Component, type ReactNode } from 'react'
import { Switch, Route, useLocation } from 'wouter'
import { Sidebar, BottomNav } from '@/components/layout/sidebar'
import { GlobalShortcuts } from '@/components/layout/global-shortcuts'
import { checkAuth } from '@/lib/auth'
import { getMRRByMonth } from '@/lib/supabase/queries/revenue'
import LoginPage from '@/pages/login'
import DashboardPage from '@/pages/dashboard'
import ClientsPage from '@/pages/clients'
import TasksPage from '@/pages/tasks'
import HappyDogPage from '@/pages/happydog'
import RevenuePage from '@/pages/revenue'
import CampaignsPage from '@/pages/campaigns'
import ContactsPage from '@/pages/contacts'
import SettingsPage from '@/pages/settings'

function Spinner() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function NotFound() {
  const [, navigate] = useLocation()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Page not found</p>
      <button onClick={() => navigate('/')} style={{ padding: '7px 16px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Go home</button>
    </div>
  )
}

function SupabaseNotConfigured() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '16px', padding: '32px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚙</div>
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Supabase not configured</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Set <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>VITE_SUPABASE_URL</code> and{' '}
          <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>VITE_SUPABASE_ANON_KEY</code>{' '}
          in the laaksolabs artifact environment variables, then restart the app.
        </p>
      </div>
    </div>
  )
}

interface ErrorBoundaryState { hasError: boolean; isSupabaseError: boolean }

class PageErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, isSupabaseError: false }
  }
  static getDerivedStateFromError(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    const isSupabaseError = msg.includes('URL and API key are required') || msg.includes('VITE_SUPABASE')
    return { hasError: true, isSupabaseError }
  }
  render() {
    if (this.state.hasError) {
      if (this.state.isSupabaseError) return <SupabaseNotConfigured />
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px', padding: '32px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Something went wrong</p>
          <button onClick={() => this.setState({ hasError: false, isSupabaseError: false })} style={{ padding: '7px 16px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppShell({ children, currentMRR }: { children: ReactNode; currentMRR: number }) {
  return (
    <>
      <GlobalShortcuts />
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar currentMRR={currentMRR} />
          <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <PageErrorBoundary key={children?.toString()}>
              {children}
            </PageErrorBoundary>
          </main>
        </div>
        <BottomNav />
      </div>
    </>
  )
}

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'authed' | 'unauthed'>('loading')
  const [currentMRR, setCurrentMRR] = useState(0)
  const [location] = useLocation()

  useEffect(() => {
    checkAuth().then(ok => setAuthState(ok ? 'authed' : 'unauthed'))
  }, [location])

  useEffect(() => {
    if (authState !== 'authed') return
    getMRRByMonth(1)
      .then(rows => {
        if (rows.length > 0) setCurrentMRR(rows[rows.length - 1].total)
      })
      .catch(() => {})
  }, [authState])

  if (authState === 'loading') return <Spinner />

  if (authState === 'unauthed') {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <LoginPage />
        </Route>
      </Switch>
    )
  }

  return (
    <AppShell currentMRR={currentMRR}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/clients/:id" component={ClientsPage} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/happydog" component={HappyDogPage} />
        <Route path="/revenue" component={RevenuePage} />
        <Route path="/campaigns" component={CampaignsPage} />
        <Route path="/contacts" component={ContactsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  )
}
