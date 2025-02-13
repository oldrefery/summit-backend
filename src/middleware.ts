// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip requests to API and static files
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Skip login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  const authSession = request.cookies.get('auth_session');

  // If there is no session, redirect to the login page
  if (!authSession?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session = JSON.parse(authSession.value);

    // Check if the session has expired
    if (session.expires < Date.now()) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)',
};
