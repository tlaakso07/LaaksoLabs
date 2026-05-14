'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    return (localStorage.getItem('theme') ?? 'dark') !== 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    const theme = next ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30px',
        height: '30px',
        borderRadius: '8px',
        border: '1px solid var(--toggle-border)',
        background: 'var(--toggle-bg)',
        color: 'var(--toggle-icon)',
        cursor: 'pointer',
        transition: 'background 120ms ease, color 120ms ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'var(--toggle-hover-bg)'
        el.style.color = 'var(--toggle-hover-icon)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'var(--toggle-bg)'
        el.style.color = 'var(--toggle-icon)'
      }}
    >
      {isDark
        ? <Sun size={12} strokeWidth={1.75} />
        : <Moon size={12} strokeWidth={1.75} />
      }
    </button>
  )
}
