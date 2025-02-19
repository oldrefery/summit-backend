import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { AUTH } from '@/app/constants';

const mockSet = vi.fn();

// Mock next/headers
vi.mock('next/headers', () => ({
    cookies: () => ({
        set: mockSet,
    }),
}));

// Mock environment variables
vi.mock('process', () => ({
    env: {
        SUPABASE_ANON_EMAIL: 'test@example.com',
        SUPABASE_ANON_PASSWORD: 'test-password',
        NODE_ENV: 'test',
    },
}));

describe('Login API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle successful login', async () => {
        const request = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test-password',
            }),
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
            },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ success: true });
        expect(mockSet).toHaveBeenCalledWith(
            AUTH.COOKIE.NAME,
            expect.any(String),
            expect.objectContaining({
                ...AUTH.COOKIE.OPTIONS,
                secure: false,
                expires: expect.any(Date),
            })
        );
    });

    it('should handle invalid credentials', async () => {
        const request = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'wrong@example.com',
                password: 'wrong-password',
            }),
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
            },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({ message: 'Invalid credentials' });
        expect(mockSet).not.toHaveBeenCalled();
    });

    it('should handle rate limiting', async () => {
        const makeRequest = () => new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'wrong@example.com',
                password: 'wrong-password',
            }),
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
            },
        });

        // Make 6 failed attempts (5 is the limit)
        for (let i = 0; i < 6; i++) {
            await POST(makeRequest());
        }

        const response = await POST(makeRequest());
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data).toEqual({
            message: 'Too many login attempts. Please try again later.',
        });
    });

    it('should handle invalid request body', async () => {
        const request = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: 'invalid-json',
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
            },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ message: 'Internal server error' });
    });

    it('should handle missing email or password', async () => {
        const requestWithoutEmail = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ password: 'test-password' }),
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
            },
        });

        const requestWithoutPassword = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' }),
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
            },
        });

        const responseWithoutEmail = await POST(requestWithoutEmail);
        const dataWithoutEmail = await responseWithoutEmail.json();

        expect(responseWithoutEmail.status).toBe(400);
        expect(dataWithoutEmail).toEqual({ message: 'Email and password are required' });

        const responseWithoutPassword = await POST(requestWithoutPassword);
        const dataWithoutPassword = await responseWithoutPassword.json();

        expect(responseWithoutPassword.status).toBe(400);
        expect(dataWithoutPassword).toEqual({ message: 'Email and password are required' });
    });

    it('should handle cookie setting failure', async () => {
        // Мокаем ошибку при установке cookie
        mockSet.mockImplementationOnce(() => {
            throw new Error('Failed to set cookie');
        });

        const request = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test-password',
            }),
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
            },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ message: 'Failed to create session' });
    });
}); 