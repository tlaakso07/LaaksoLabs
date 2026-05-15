import { useState, useEffect } from 'react'
import { Switch, Route, useLocation } from 'wouter'
import { Sidebar } from '@/components/layout/sidebar'
import { GlobalShortcuts } from '@/components/layout/global-shortcuts'
import { checkAuth } from '@/lib/auth'
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

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalShortcuts />
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {children}
        </main>
      </div>
    </>
  )
}

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'authed' | 'unauthed'>('loading')
  const [location] = useLocation()

  useEffect(() => {
    checkAuth().then(ok => setAuthState(ok ? 'authed' : 'unauthed'))
  }, [location])

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
    <AppShell>
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
