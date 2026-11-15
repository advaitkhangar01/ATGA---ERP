import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session-token')?.value;

  // Public paths that do not require authentication
  const isAuthPath = pathname.startsWith('/login');
  const isApiPath = pathname.startsWith('/api');
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.');

  if (isStaticAsset || isApiPath) {
    return NextResponse.next();
  }

  // If user is already authenticated and visits /login, redirect to /dashboard
  if (isAuthPath) {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // If user is not authenticated and attempts to access protected routes, redirect to /login
  if (!sessionToken && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware across all application paths
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};
