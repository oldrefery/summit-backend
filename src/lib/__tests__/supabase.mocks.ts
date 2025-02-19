import { vi } from 'vitest';
import { SupabaseClient, AuthError, Session, User } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

// TODO: Fix type issues with Supabase mocks
// 1. Proper implementation of AuthError
// 2. Complete StorageFileApi interface implementation
// 3. Correct PostgrestQueryBuilder types
// 4. Add missing MFA API methods
// See issue #XXX for tracking

// Mock implementation of AuthError
export class MockAuthError extends AuthError {
    constructor(message: string) {
        super(message);
        this.name = 'AuthError';
        this.status = 401;
    }
}

export const mockPerson = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'speaker' as const,
    created_at: new Date().toISOString(),
};

export const mockEvent = {
    id: 1,
    title: 'Test Event',
    date: new Date().toISOString(),
    section_id: 1,
    start_time: '10:00',
    end_time: '11:00',
    created_at: new Date().toISOString(),
};

export const mockSession: Session = {
    access_token: 'test-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
        id: '1',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
    } as User,
};

export const mockAuthError = new AuthError('Invalid credentials');

// Helper to create a mock storage bucket
function createMockStorageBucket() {
    return {
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'test-url' }, error: null }),
        createSignedUploadUrl: vi.fn().mockResolvedValue({ data: { token: 'test-token', url: 'test-url' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        move: vi.fn().mockResolvedValue({ data: { path: 'new-path' }, error: null }),
        copy: vi.fn().mockResolvedValue({ data: { path: 'copy-path' }, error: null }),
        uploadToSignedUrl: vi.fn().mockResolvedValue({ data: { path: 'signed-path' }, error: null }),
        info: vi.fn().mockResolvedValue({ data: { size: 1000, mimetype: 'text/plain' }, error: null }),
    };
}

// Helper to create a mock query builder
function createMockQueryBuilder() {
    const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn(),
    };

    return mockChain;
}

export function createMockSupabaseClient(): Partial<SupabaseClient<Database>> {
    const mockAuth = {
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({
            data: {
                user: mockSession.user,
                session: mockSession
            },
            error: null
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
        mfa: {
            enroll: vi.fn(),
            challenge: vi.fn(),
            verify: vi.fn(),
            unenroll: vi.fn(),
            listFactors: vi.fn(),
            challengeAndVerify: vi.fn(),
            getAuthenticatorAssuranceLevel: vi.fn(),
        },
        // Добавляем необходимые свойства для SupabaseAuthClient
        instanceID: 'test-instance',
        admin: {},
        storageKey: 'test-storage-key',
        flowType: 'implicit',
    };

    const mockStorage = {
        from: vi.fn().mockReturnValue(createMockStorageBucket()),
        // Добавляем необходимые свойства для StorageClient
        url: 'https://test.storage.com',
        headers: {},
        fetch: vi.fn(),
        listBuckets: vi.fn(),
        getBucket: vi.fn(),
        createBucket: vi.fn(),
        updateBucket: vi.fn(),
        deleteBucket: vi.fn(),
        emptyBucket: vi.fn(),
    };

    return {
        // @ts-expect-error - временно отключаем проверку типов для моков
        auth: mockAuth,
        // @ts-expect-error - временно отключаем проверку типов для моков
        storage: mockStorage,
        from: vi.fn().mockReturnValue(createMockQueryBuilder()),
    };
} 