import { vi } from 'vitest';
import {
    AuthError,
    Session,
    User,
    AuthMFAEnrollResponse,
    AuthMFAChallengeResponse,
    AuthMFAVerifyResponse,
    AuthMFAUnenrollResponse,
    AuthMFAListFactorsResponse,
    AuthMFAGetAuthenticatorAssuranceLevelResponse,
    SupabaseClientOptions
} from '@supabase/supabase-js';
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

interface MockStorageBucket {
    upload: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    createSignedUrl: ReturnType<typeof vi.fn>;
    createSignedUploadUrl: ReturnType<typeof vi.fn>;
    download: ReturnType<typeof vi.fn>;
    getPublicUrl: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    move: ReturnType<typeof vi.fn>;
    copy: ReturnType<typeof vi.fn>;
    uploadToSignedUrl: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
}

// Helper to create a mock storage bucket
function createMockStorageBucket(): MockStorageBucket {
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

interface MockQueryBuilder {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
}

// Helper to create a mock query builder
function createMockQueryBuilder(): MockQueryBuilder {
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

type MockSupabaseAuth = {
    getSession: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    getUser: ReturnType<typeof vi.fn>;
    mfa: {
        enroll: ReturnType<typeof vi.fn>;
        challenge: ReturnType<typeof vi.fn>;
        verify: ReturnType<typeof vi.fn>;
        unenroll: ReturnType<typeof vi.fn>;
        listFactors: ReturnType<typeof vi.fn>;
        challengeAndVerify: ReturnType<typeof vi.fn>;
        getAuthenticatorAssuranceLevel: ReturnType<typeof vi.fn>;
    };
};

type MockSupabaseStorage = {
    from: ReturnType<typeof vi.fn>;
};

type MockSupabaseClient = {
    auth: MockSupabaseAuth;
    storage: MockSupabaseStorage;
    from: ReturnType<typeof vi.fn>;
};

interface MockSupabaseClientOptions extends Partial<SupabaseClientOptions<Database>> {
    auth?: {
        autoRefreshToken?: boolean;
        persistSession?: boolean;
        detectSessionInUrl?: boolean;
    };
}

export function createMockSupabaseClient(options: MockSupabaseClientOptions = {}): MockSupabaseClient {
    const mockAuth: MockSupabaseAuth = {
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
            enroll: vi.fn().mockResolvedValue({} as AuthMFAEnrollResponse),
            challenge: vi.fn().mockResolvedValue({} as AuthMFAChallengeResponse),
            verify: vi.fn().mockResolvedValue({} as AuthMFAVerifyResponse),
            unenroll: vi.fn().mockResolvedValue({} as AuthMFAUnenrollResponse),
            listFactors: vi.fn().mockResolvedValue({} as AuthMFAListFactorsResponse),
            challengeAndVerify: vi.fn().mockResolvedValue({} as AuthMFAVerifyResponse),
            getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({} as AuthMFAGetAuthenticatorAssuranceLevelResponse),
        },
    };

    const mockStorage: MockSupabaseStorage = {
        from: vi.fn().mockReturnValue(createMockStorageBucket()),
    };

    return {
        auth: mockAuth,
        storage: mockStorage,
        from: vi.fn().mockReturnValue(createMockQueryBuilder()),
        ...options,
    } as MockSupabaseClient;
} 