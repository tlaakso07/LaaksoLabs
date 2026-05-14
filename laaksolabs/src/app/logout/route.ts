import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function clearAndRedirect(request: Request) {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  const url = new URL('/login', request.url)
  return NextResponse.redirect(url, { status: 303 })
}

export const GET = clearAndRedirect
export const POST = clearAndRedirect
