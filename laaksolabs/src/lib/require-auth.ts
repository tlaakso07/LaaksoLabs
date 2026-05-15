import { cookies } from 'next/headers'
import { SESSION_COOKIE, getAuthSecret, getAuthUsername, verifySession } from './auth'

export type AuthCheck = { ok: true } | { ok: false; status: 401 }

export async function requireAuth(): Promise<AuthCheck> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const valid = await verifySession(token, getAuthSecret(), getAuthUsername())
  return valid ? { ok: true } : { ok: false, status: 401 }
}
