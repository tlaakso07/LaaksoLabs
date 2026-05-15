import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, getAuthSecret, getAuthUsername, verifySession } from '@/lib/auth'

const PUBLIC_PATHS = new Set(['/login', '/api/login'])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/favicon')) return true
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') return true
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Always expose the path so the root layout can decide whether to render the sidebar
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)

  if (isPublicPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  let valid = false
  try {
    valid = await verifySession(token, getAuthSecret(), getAuthUsername())
  } catch {
    valid = false
  }

  if (!valid) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    if (pathname !== '/') url.searchParams.set('next', pathname + (search || ''))
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
