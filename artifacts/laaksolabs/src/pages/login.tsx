import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { login, checkAuth } from '@/lib/auth'

export default function LoginPage() {
  const [, navigate] = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth().then(ok => { if (ok) navigate('/') })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError('Enter your username and password.'); return }
    setLoading(true); setError('')
    const result = await login(username, password)
    if (result.ok) {
      window.location.href = '/'
    } else {
      setError(result.error ?? 'Login failed.')
      setLoading(false)
    }
  }

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: '14px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '10px', color: 'var(--text)', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 120ms ease',
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: 'var(--shadow-card)',
          }}>
            <Zap size={22} strokeWidth={2} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.04em', margin: '0 0 6px' }}>
            Laakso Labs
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Sign in to your command center
          </p>
        </div>

        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: '18px', padding: '28px', boxShadow: 'var(--shadow-card)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin" autoComplete="username" required
                style={INPUT}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" required
                  style={{ ...INPUT, paddingRight: '42px' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0', display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && (
              <p style={{ fontSize: '12px', color: 'var(--urgent)', padding: '8px 12px', background: 'color-mix(in srgb, var(--urgent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--urgent) 25%, transparent)', borderRadius: '8px', margin: 0 }}>
                {error}
              </p>
            )}
            <button
              type="submit" disabled={loading}
              style={{ padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: loading ? 'var(--surface-3)' : 'var(--accent)', color: loading ? 'var(--text-muted)' : '#fff', border: 'none', cursor: loading ? 'default' : 'pointer', letterSpacing: '-0.01em', marginTop: '2px', transition: 'background 120ms ease' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-faint)', marginTop: '20px' }}>
          Private workspace — Laakso Labs © 2025
        </p>
      </div>
    </div>
  )
}
