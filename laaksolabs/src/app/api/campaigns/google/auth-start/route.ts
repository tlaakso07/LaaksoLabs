import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface AuthStartBody {
  client_id?: string
  client_secret?: string
  developer_token?: string
  customer_id?: string
  redirect_uri?: string
}

function randomState(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as AuthStartBody
  const { client_id, client_secret, developer_token, customer_id, redirect_uri } = body

  if (!client_id || !client_secret || !developer_token || !customer_id || !redirect_uri) {
    return NextResponse.json(
      { error: 'client_id, client_secret, developer_token, customer_id, redirect_uri are all required' },
      { status: 400 },
    )
  }

  const state = randomState()
  const sb = createAdminClient()
  const { error } = await sb.from('oauth_states').insert({
    state,
    provider: 'google',
    payload: { client_id, client_secret, developer_token, customer_id, redirect_uri },
  })

  if (error) {
    return NextResponse.json({ error: `Failed to store OAuth state: ${error.message}` }, { status: 500 })
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', client_id)
  authUrl.searchParams.set('redirect_uri', redirect_uri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', state)

  return NextResponse.json({ auth_url: authUrl.toString(), state })
}
