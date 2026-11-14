import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // In a full production setup, this is where NextAuth or Clerk validates the token
  const userRole = request.cookies.get('user-role')?.value || 'admin' // fallback for prototype

  // Example RBAC: prevent staff from accessing sensitive administrative modules
  if (userRole === 'staff') {
    const restrictedPaths = ['/migration', '/settings', '/audit', '/users']
    
    // In our Next.js architecture, the dashboard is a single page app on '/', 
    // but if we move these to separate routes, this middleware intercepts it.
    // For Server Actions, we will check this role explicitly within the action.
    const isRestricted = restrictedPaths.some(p => request.nextUrl.pathname.startsWith(p))
    
    if (isRestricted) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Apply middleware to all routes except API and static assets
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
