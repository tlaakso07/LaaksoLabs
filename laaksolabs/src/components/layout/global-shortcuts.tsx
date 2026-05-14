'use client'

import { useState, useEffect } from 'react'
import { CommandPalette } from './command-palette'
import { QuickAddTask } from './quick-add-task'

export function GlobalShortcuts() {
  const [paletteOpen, setPaletteOpen]   = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setQuickAddOpen(false)
        setPaletteOpen(p => !p)
        return
      }

      // N → quick add task (only when not typing in a field)
      const tag = (e.target as HTMLElement).tagName
      const isEditable = (e.target as HTMLElement).isContentEditable
      if (
        e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !isEditable
      ) {
        setPaletteOpen(false)
        setQuickAddOpen(true)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  return (
    <>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <QuickAddTask   open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  )
}
