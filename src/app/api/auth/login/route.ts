// src/app/api/auth/login/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';
import { AUTH } from '@/app/constants';

const limiter = new RateLimiter();

// Функция для логирования ошибок только в не-тестовом окружении
function logError(error: unknown, context: string) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Auth API] ${context}:`, error);
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  let body;
  try {
    body = await request.json();
  } catch (error: unknown) {
    logError(error, 'Failed to parse request body');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }

  const { email, password } = body;

  // Проверяем наличие необходимых полей
  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email and password are required' },
      { status: 400 }
    );
  }

  try {
    // Check the credentials from the env
    if (
      email === process.env.SUPABASE_ANON_EMAIL &&
      password === process.env.SUPABASE_ANON_PASSWORD
    ) {
      // Create a session with expiration time
      const session = {
        email,
        created: Date.now(),
        expires: Date.now() + AUTH.SESSION_DURATION,
      };

      try {
        // Set secure HTTP-only cookie with session data
        const cookieStore = await cookies();
        cookieStore.set(AUTH.COOKIE.NAME, JSON.stringify(session), {
          ...AUTH.COOKIE.OPTIONS,
          secure: process.env.NODE_ENV === 'production',
          expires: new Date(session.expires),
        });

        return NextResponse.json({ success: true });
      } catch (error: unknown) {
        logError(error, 'Failed to set session cookie');
        return NextResponse.json(
          { message: 'Failed to create session' },
          { status: 500 }
        );
      }
    }

    // Check the attempts limit after failed authentication
    if (await limiter.isRateLimited(ip)) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Increment the failed attempts counter
    await limiter.increment(ip);

    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error: unknown) {
    logError(error, 'Unexpected error during authentication');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
