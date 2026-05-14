'use client'

import { useState, useEffect } from 'react'
import { CommandPalette } from './command-palette'
import { QuickAddTask } from './quick-add-task'

export function GlobalShortcuts() {
  const [paletteOpen, setPaletteOpen]   = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [paletteKey, setPaletteKey]     = useState(0)
  const [quickAddKey, setQuickAddKey]   = useState(0)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setQuickAddOpen(false)
        setPaletteOpen(p => {
          if (!p) setPaletteKey(k => k + 1)
          return !p
        })
        return
      }

      const tag = (e.target as HTMLElement).tagName
      const isEditable = (e.target as HTMLElement).isContentEditable
      if (
        e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !isEditable
      ) {
        setPaletteOpen(false)
        setQuickAddKey(k => k + 1)
        setQuickAddOpen(true)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  return (
    <>
      <CommandPalette key={paletteKey}  open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <QuickAddTask   key={quickAddKey} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  )
}
