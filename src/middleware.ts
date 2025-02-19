// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Паттерны для исключения из проверки
const EXCLUDED_PATTERNS = [
  /^\/api\//,
  /^\/_next\//,
  /^\/favicon\.ico$/
];

export function middleware(request: NextRequest) {
  // Проверяем исключенные пути
  if (EXCLUDED_PATTERNS.some(pattern => pattern.test(request.nextUrl.pathname))) {
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
