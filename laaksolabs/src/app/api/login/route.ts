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

function safePath(value: string): string {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export async function POST(req: NextRequest) {
  let username = ''
  let password = ''
  let redirectTo = '/'
  try {
    const data = await req.formData()
    username = String(data.get('username') ?? '').trim()
    password = String(data.get('password') ?? '')
    redirectTo = safePath(String(data.get('redirectTo') ?? '/'))
  } catch {
    const url = new URL('/login', req.url)
    url.searchParams.set('error', '1')
    return NextResponse.redirect(url, { status: 303 })
  }

  if (!checkCredentials(username, password)) {
    const url = new URL('/login', req.url)
    url.searchParams.set('error', '1')
    if (redirectTo !== '/') url.searchParams.set('next', redirectTo)
    return NextResponse.redirect(url, { status: 303 })
  }

  const token = await signSession(getAuthUsername(), getAuthSecret())
  const url = new URL(redirectTo, req.url)
  const res = NextResponse.redirect(url, { status: 303 })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
  return res
}
