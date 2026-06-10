import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pages that don't need login
const PUBLIC_PATHS = ['/login', '/register']

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '')

  const isPublic = PUBLIC_PATHS.some(p => request.nextUrl.pathname.startsWith(p))

  // Not logged in + trying to access a protected page → send to login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in + visiting login or register → send to dashboard
  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Which routes this middleware runs on (not static files)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}