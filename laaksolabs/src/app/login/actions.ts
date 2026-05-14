'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  checkCredentials,
  getAuthSecret,
  getAuthUsername,
  signSession,
} from '@/lib/auth'

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirectTo') ?? '/')

  if (!checkCredentials(username, password)) {
    return { error: 'Invalid username or password' }
  }

  const token = await signSession(getAuthUsername(), getAuthSecret())
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
  console.log('[login] cookie set, token length:', token.length, 'all cookies after set:', jar.getAll().map((c) => c.name))

  const safe = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/'
  redirect(safe)
}
