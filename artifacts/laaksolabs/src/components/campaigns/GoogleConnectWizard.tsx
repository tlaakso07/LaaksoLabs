import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink, CheckCircle, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react'

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

interface Props {
  onClose: () => void
}

interface Credentials {
  developer_token: string
  customer_id: string
  client_id: string
  client_secret: string
}

type Step = 'prereqs' | 'credentials' | 'authorizing' | 'done' | 'error'

const INPUT: React.CSSProperties = {
  padding: '8px 11px', fontSize: '12px', background: 'var(--surface-2)',
  border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)',
  outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
}
const LABEL: React.CSSProperties = {
  fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const,
  letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '5px', display: 'block',
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div>
      <span style={LABEL}>{label}</span>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <code style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text)', wordBreak: 'break-all' as const }}>
          {value}
        </code>
        <button onClick={copy} title="Copy"
          style={{ flexShrink: 0, width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', border: '1px solid var(--border)', background: copied ? '#0d2e1a' : 'var(--surface-2)', color: copied ? '#22c55e' : 'var(--text-muted)', cursor: 'pointer' }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  )
}

export function GoogleConnectWizard({ onClose }: Props) {
  const redirectUri = `${window.location.origin}/api/campaigns/google/oauth-callback`

  const [step, setStep] = useState<Step>('prereqs')
  const [creds, setCreds] = useState<Credentials>({ developer_token: '', customer_id: '', client_id: '', client_secret: '' })
  const [oauthState, setOauthState] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [starting, setStarting] = useState(false)
  const [prereqCopied, setPrereqCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const f = (k: keyof Credentials, v: string) => setCreds(p => ({ ...p, [k]: v }))
  const allFilled = Object.values(creds).every(v => v.trim())

  // Poll for OAuth completion after auth tab is opened
  useEffect(() => {
    if (step !== 'authorizing' || !oauthState) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/campaigns/google/oauth-status/${oauthState}`, { credentials: 'include' })
        const data = await res.json() as { status: string; error?: string }
        if (data.status === 'complete') {
          clearInterval(pollRef.current!)
          setStep('done')
        } else if (data.status === 'error') {
          clearInterval(pollRef.current!)
          setErrorMsg(data.error ?? 'Authorization failed')
          setStep('error')
        } else if (data.status === 'expired') {
          clearInterval(pollRef.current!)
          setErrorMsg('Session expired. Please try again.')
          setStep('error')
        }
      } catch {
        // Network error — keep polling
      }
    }, 2000)
    return () => clearInterval(pollRef.current!)
  }, [step, oauthState])

  async function startAuth() {
    setStarting(true)
    setErrorMsg('')
    try {
      const res = await fetch(`${API_BASE}/api/campaigns/google/auth-start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...creds, redirect_uri: redirectUri }),
      })
      const data = await res.json() as { auth_url?: string; state?: string; error?: string }
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'Failed to start authorization')
        setStarting(false)
        return
      }
      setOauthState(data.state!)
      window.open(data.auth_url!, '_blank', 'width=600,height=700,noopener')
      setStep('authorizing')
    } catch {
      setErrorMsg('Network error — is the API server running?')
    }
    setStarting(false)
  }

  function copyRedirectUri() {
    navigator.clipboard.writeText(redirectUri).then(() => {
      setPrereqCopied(true)
      setTimeout(() => setPrereqCopied(false), 2000)
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: '540px', background: 'var(--surface-1)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EA433518', border: '1px solid #EA433335', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Connect Google Ads</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                {step === 'prereqs' && 'Step 1 of 3 — Before you start'}
                {step === 'credentials' && 'Step 2 of 3 — Enter credentials'}
                {step === 'authorizing' && 'Step 3 of 3 — Authorizing'}
                {step === 'done' && 'All done!'}
                {step === 'error' && 'Something went wrong'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '7px', border: 'none', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={12} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '2px', background: 'var(--border)' }}>
          <div style={{ height: '100%', background: '#EA4335', width: step === 'prereqs' ? '33%' : step === 'credentials' ? '66%' : '100%', transition: 'width 0.3s ease' }} />
        </div>

        <div style={{ padding: '24px' }}>

          {/* ── Step 1: Prerequisites ─────────────────────────────── */}
          {step === 'prereqs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.7 }}>
                You'll need a few things set up in Google before connecting. This only takes about 5 minutes.
              </p>

              {[
                {
                  n: '1', title: 'Google Ads Developer Token',
                  body: <>In Google Ads, go to <strong style={{ color: 'var(--text)' }}>Tools → API Center</strong>. Apply for Basic Access if you haven't already. Copy the Developer Token.</>,
                  link: 'https://ads.google.com/aw/apicenter', linkLabel: 'Open API Center →'
                },
                {
                  n: '2', title: 'Google Cloud OAuth Credentials',
                  body: <>Create a project in <strong style={{ color: 'var(--text)' }}>Google Cloud Console</strong>, enable the <strong style={{ color: 'var(--text)' }}>Google Ads API</strong>, then go to <strong style={{ color: 'var(--text)' }}>APIs & Services → Credentials → Create OAuth 2.0 Client ID</strong>. Choose <strong style={{ color: 'var(--text)' }}>Web application</strong>.</>,
                  link: 'https://console.cloud.google.com/apis/credentials', linkLabel: 'Open Cloud Console →'
                },
                {
                  n: '3', title: 'Add this redirect URI to your OAuth client',
                  body: <>In your OAuth client settings, under <strong style={{ color: 'var(--text)' }}>Authorized redirect URIs</strong>, add the URL below exactly as shown. Then save.</>,
                  extra: (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <code style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text)', wordBreak: 'break-all' as const }}>
                        {redirectUri}
                      </code>
                      <button onClick={copyRedirectUri} title="Copy"
                        style={{ flexShrink: 0, width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', border: '1px solid var(--border)', background: prereqCopied ? '#0d2e1a' : 'var(--surface-2)', color: prereqCopied ? '#22c55e' : 'var(--text-muted)', cursor: 'pointer' }}>
                        {prereqCopied ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  )
                },
              ].map(item => (
                <div key={item.n} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EA433318', border: '1px solid #EA433340', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#EA4335' }}>{item.n}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>{item.title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{item.body}</p>
                    {'link' in item && item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#EA4335', marginTop: '6px', textDecoration: 'none' }}>
                        {item.linkLabel} <ExternalLink size={10} />
                      </a>
                    )}
                    {'extra' in item && item.extra}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button onClick={() => setStep('credentials')}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#EA4335', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  I'm ready → Enter credentials
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Credentials ───────────────────────────────── */}
          {step === 'credentials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Enter the credentials you collected. Nothing is saved here yet — they stay in memory only until the OAuth flow completes.
              </p>

              <div>
                <label style={LABEL}>Developer Token</label>
                <input value={creds.developer_token} onChange={e => f('developer_token', e.target.value)} placeholder="From Google Ads → Tools → API Center" style={INPUT} />
              </div>
              <div>
                <label style={LABEL}>Customer ID</label>
                <input value={creds.customer_id} onChange={e => f('customer_id', e.target.value)} placeholder="e.g. 123-456-7890" style={INPUT} />
                <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>Shown in the top right of Google Ads. Dashes are OK.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LABEL}>Client ID</label>
                  <input value={creds.client_id} onChange={e => f('client_id', e.target.value)} placeholder="...apps.googleusercontent.com" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Client Secret</label>
                  <input value={creds.client_secret} onChange={e => f('client_secret', e.target.value)} placeholder="GOCSPX-..." type="password" style={INPUT} />
                </div>
              </div>

              {errorMsg && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#1f0a0a', border: '1px solid #3f1a1a', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: '#ef8888', margin: 0 }}>{errorMsg}</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <button onClick={() => setStep('prereqs')}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button onClick={startAuth} disabled={!allFilled || starting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#EA4335', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: allFilled && !starting ? 'pointer' : 'default', opacity: allFilled && !starting ? 1 : 0.5 }}>
                  {starting ? <><RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Starting...</> : <>Sign in with Google →</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Authorizing ───────────────────────────────── */}
          {step === 'authorizing' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EA433318', border: '1px solid #EA433340', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={22} style={{ color: '#EA4335', animation: 'spin 1.2s linear infinite' }} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Waiting for Google authorization</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '20px' }}>
                A Google sign-in window should have opened. Complete the authorization there — this page will update automatically once done.
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Window didn't open?{' '}
                <button onClick={startAuth} style={{ background: 'none', border: 'none', color: '#EA4335', fontSize: '11px', cursor: 'pointer', padding: 0 }}>Try again</button>
              </p>
            </div>
          )}

          {/* ── Done ──────────────────────────────────────────────── */}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '10px', background: '#0d2e1a', border: '1px solid #1a5c35' }}>
                <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', margin: '0 0 2px' }}>Authorization successful!</p>
                  <p style={{ fontSize: '12px', color: '#4ade80', margin: 0 }}>The tab that opened shows all 5 secrets to add to Replit.</p>
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', margin: '0 0 10px' }}>Now do this in the Google tab that opened:</p>
                <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    'Copy each secret from that page',
                    'Open Replit → click the lock (Secrets) icon in the sidebar',
                    'Add all 5 secrets with the exact names shown',
                    'Restart the API Server workflow',
                  ].map((s, i) => <li key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s}</li>)}
                </ol>
              </div>

              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secrets needed</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_REFRESH_TOKEN'].map(s => (
                    <code key={s} style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '5px', background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{s}</code>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onClose}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────── */}
          {step === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', borderRadius: '10px', background: '#1f0a0a', border: '1px solid #3f1a1a' }}>
                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', margin: '0 0 4px' }}>Authorization failed</p>
                  <p style={{ fontSize: '12px', color: '#ef8888', margin: 0, lineHeight: 1.6 }}>{errorMsg}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={onClose}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={() => { setStep('credentials'); setErrorMsg('') }}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#EA4335', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
