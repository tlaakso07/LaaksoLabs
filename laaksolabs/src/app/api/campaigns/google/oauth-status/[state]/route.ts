import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const FIFTEEN_MIN_MS = 15 * 60 * 1000

interface StateRow {
  state: string
  refresh_token: string | null
  error: string | null
  created_at: string
  payload: {
    client_id: string
    client_secret: string
    developer_token: string
    customer_id: string
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ state: string }> }) {
  const auth = await requireAuth()
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { state } = await ctx.params
  const sb = createAdminClient()

  const { data } = await sb
    .from('oauth_states')
    .select('state, refresh_token, error, created_at, payload')
    .eq('state', state)
    .single<StateRow>()

  if (!data) return NextResponse.json({ status: 'expired' })

  if (Date.now() - new Date(data.created_at).getTime() > FIFTEEN_MIN_MS) {
    await sb.from('oauth_states').delete().eq('state', state)
    return NextResponse.json({ status: 'expired' })
  }

  if (data.refresh_token) {
    const result = {
      status: 'complete' as const,
      refresh_token: data.refresh_token,
      client_id: data.payload.client_id,
      client_secret: data.payload.client_secret,
      developer_token: data.payload.developer_token,
      customer_id: data.payload.customer_id,
    }
    await sb.from('oauth_states').delete().eq('state', state)
    return NextResponse.json(result)
  }

  if (data.error) {
    await sb.from('oauth_states').delete().eq('state', state)
    return NextResponse.json({ status: 'error' as const, error: data.error })
  }

  return NextResponse.json({ status: 'pending' as const })
}
