// src/app/api/auth/login/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';

const limiter = new RateLimiter();

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // Check the attempts limit
  if (await limiter.isRateLimited(ip)) {
    return NextResponse.json(
      { message: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // Check the credentials from the env
    if (
      email === process.env.SUPABASE_ANON_EMAIL &&
      password === process.env.SUPABASE_ANON_PASSWORD
    ) {
      // Create a session
      const session = {
        email,
        created: Date.now(),
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 часа
      };

      // Define the cookie with the session data
      (await cookies()).set('auth_session', JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(session.expires),
      });

      return NextResponse.json({ success: true });
    }

    // Increment the failed attempts counter
    await limiter.increment(ip);

    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
