import { NextRequest, NextResponse } from 'next/server'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  checkCredentials,
  getAuthSecret,
  getAuthUsername,
  signSession,
} from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let username = ''
  let password = ''
  try {
    const data = await req.formData()
    username = String(data.get('username') ?? '').trim()
    password = String(data.get('password') ?? '')
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const token = await signSession(getAuthUsername(), getAuthSecret())
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
  return res
}
