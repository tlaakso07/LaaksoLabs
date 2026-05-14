'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { loginAction } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
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
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.65 : 1,
        transition: 'opacity 120ms ease',
      }}
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const params = useSearchParams()
  const redirectTo = params.get('next') || '/'
  const [state, formAction] = useActionState(loginAction, undefined)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

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

      {state?.error && (
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
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
