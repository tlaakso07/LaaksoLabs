import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const stored = (localStorage.getItem('theme') ?? 'dark') !== 'light'
    setIsDark(stored)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [isDark, mounted])

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
      aria-label="Toggle theme"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '8px',
        border: '1px solid var(--toggle-border)', background: 'var(--toggle-bg)',
        color: 'var(--toggle-icon)', cursor: 'pointer',
        transition: 'background 120ms ease, color 120ms ease', flexShrink: 0,
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
      {mounted && (isDark ? <Sun size={12} strokeWidth={1.75} /> : <Moon size={12} strokeWidth={1.75} />)}
    </button>
  )
}
