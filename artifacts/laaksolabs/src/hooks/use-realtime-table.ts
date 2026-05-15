import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeTable<T extends { id: string }>(
  table: string,
  initialData: T[]
) {
  const [data, setData] = useState<T[]>(initialData)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`rt:${table}:${Date.now()}`)
      .on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as T
            setData(prev => prev.some(r => r.id === row.id) ? prev : [row, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as T
            setData(prev => prev.map(r => r.id === row.id ? { ...r, ...row } : r))
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id: string }).id
            setData(prev => prev.filter(r => r.id !== id))
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [table])

  return [data, setData] as const
}
