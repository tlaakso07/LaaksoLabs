export function LoginForm({ hasError, next }: { hasError: boolean; next: string }) {
  return (
    <form action="/api/login" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <input type="hidden" name="redirectTo" value={next} />

      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
          Username
        </span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          required
          autoFocus
          style={{
            padding: '10px 12px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={{
            padding: '10px 12px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </label>

      {hasError && (
        <p
          role="alert"
          style={{
            fontSize: '12px',
            color: 'var(--danger, #EF4444)',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            padding: '8px 10px',
            borderRadius: '7px',
          }}
        >
          Invalid username or password
        </p>
      )}

      <button
        type="submit"
        style={{
          width: '100%',
          padding: '11px 14px',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: '9px',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          transition: 'opacity 120ms ease',
        }}
      >
        Sign in
      </button>
    </form>
  )
}
