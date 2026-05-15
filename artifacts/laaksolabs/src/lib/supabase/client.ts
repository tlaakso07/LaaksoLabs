import { createBrowserClient } from '@supabase/ssr'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseConfigured(): boolean {
  return !!(url && key)
}

let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!url || !key) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  }
  if (!_client) {
    _client = createBrowserClient(url, key)
  }
  return _client
}
