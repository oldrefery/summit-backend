import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { AUTH } from './app/constants';

describe('Middleware', () => {
    const mockUrl = 'http://localhost:3000';

    function createRequest(path: string, cookies: Record<string, string> = {}) {
        const url = new URL(path, mockUrl);
        const request = new NextRequest(url);

        // Добавляем куки к запросу
        Object.entries(cookies).forEach(([key, value]) => {
            request.cookies.set(key, value);
        });

        return request;
    }

    it('should allow access to login page', async () => {
        const request = createRequest('/login');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(200);
    });

    it('should allow access to API routes', async () => {
        const request = createRequest('/api/auth/login');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(200);
    });

    it('should redirect to login page when no session exists', async () => {
        const request = createRequest('/protected-route');
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(307); // Temporary redirect
        expect(response.headers.get('location')).toBe(`${mockUrl}/login`);
    });

    it('should redirect to login page when session is invalid JSON', async () => {
        const request = createRequest('/protected-route', {
            [AUTH.COOKIE.NAME]: 'invalid-json'
        });
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`${mockUrl}/login`);
    });

    it('should redirect to login page when session has expired', async () => {
        const expiredSession = {
            email: 'test@example.com',
            created: Date.now() - 2 * AUTH.SESSION_DURATION,
            expires: Date.now() - AUTH.SESSION_DURATION,
        };

        const request = createRequest('/protected-route', {
            [AUTH.COOKIE.NAME]: JSON.stringify(expiredSession)
        });
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`${mockUrl}/login`);
    });

    it('should allow access to protected route with valid session', async () => {
        const validSession = {
            email: 'test@example.com',
            created: Date.now(),
            expires: Date.now() + AUTH.SESSION_DURATION,
        };

        const request = createRequest('/protected-route', {
            [AUTH.COOKIE.NAME]: JSON.stringify(validSession)
        });
        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(200);
    });

    it('should allow access to static files', async () => {
        const staticPaths = [
            '/_next/static/chunk.js',
            '/_next/image/test.jpg',
            '/favicon.ico'
        ];

        for (const path of staticPaths) {
            const request = createRequest(path);
            const response = await middleware(request);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response.status).toBe(200);
        }
    });
}); 