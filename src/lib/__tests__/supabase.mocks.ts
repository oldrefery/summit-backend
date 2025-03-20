import { vi } from 'vitest';
import {
    AuthError,
    Session,
    User,
} from '@supabase/supabase-js';

// Mock implementation of AuthError
export class MockAuthError extends AuthError {
    constructor(message = 'Auth error occurred', status = 400) {
        super(message);
        this.status = status;
    }
}

export const mockUser: User = {
    id: '123',
    email: 'john@example.com',
    role: 'admin',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

export const mockPerson = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

export const mockEvent = {
    id: '456',
    title: 'Test Event',
    date: '2024-02-01T00:00:00Z',
    location_id: '789',
    section_id: '012',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

export const mockSession: Session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: mockUser,
};

export const mockAuthError = new MockAuthError();

export const mockStorageError = {
    name: 'StorageError',
    message: 'Upload failed',
    __isStorageError: true,
};

export interface MockStorageBucket {
    upload: ReturnType<typeof vi.fn>;
    download: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
}

export interface MockQueryBuilder {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    url: string;
    headers: Record<string, string>;
    upsert: ReturnType<typeof vi.fn>;
}

export interface MockSupabaseAuth {
    signInWithPassword: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
}

export interface MockSupabaseStorage {
    from: (bucket: string) => MockStorageBucket;
}

export interface MockSupabaseClient {
    auth: MockSupabaseAuth;
    storage: MockSupabaseStorage;
    from: (table: string) => MockQueryBuilder;
}

// Helper to create a mock storage bucket
function createMockStorageBucket(): MockStorageBucket {
    return {
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
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
        url: '',
        headers: {},
        upsert: vi.fn().mockReturnThis(),
    };

    // Setting up mocks to return data
    mockChain.order.mockImplementation(() => ({ data: [mockPerson], error: null }));
    mockChain.single.mockImplementation(() => ({ data: mockPerson, error: null }));
    mockChain.eq.mockImplementation(() => ({ data: null, error: null }));

    return mockChain;
}

export function createMockSupabaseClient(): MockSupabaseClient {
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
    };

    const mockStorage: MockSupabaseStorage = {
        from: () => createMockStorageBucket(),
    };

    return {
        auth: mockAuth,
        storage: mockStorage,
        from: () => createMockQueryBuilder(),
    };
} 