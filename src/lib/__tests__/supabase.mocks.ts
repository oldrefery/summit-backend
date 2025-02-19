import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createMockSupabaseClient = () => {
    const mockStorageFrom = vi.fn(() => ({
        upload: vi.fn().mockImplementation((path, file) => Promise.resolve({ data: { path }, error: null })),
        remove: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
        url: vi.fn(),
        headers: {},
        fetch: vi.fn(),
        uploadOrUpdate: vi.fn(),
        createSignedUrl: vi.fn(),
        createSignedUrls: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(),
        list: vi.fn(),
        move: vi.fn(),
        update: vi.fn(),
    }));

    const createMockChain = () => {
        let chain: any;
        const mockSingle = vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null }));
        const mockOrder = vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null }));
        const mockEq = vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null }));
        const mockSelect = vi.fn().mockImplementation(() => ({ order: mockOrder, single: mockSingle }));

        chain = {
            select: mockSelect,
            insert: vi.fn().mockReturnValue({ select: mockSelect }),
            update: vi.fn().mockReturnValue({ eq: mockEq }),
            delete: vi.fn().mockReturnValue({ eq: mockEq }),
            eq: mockEq,
            order: mockOrder,
            single: mockSingle,
        };

        return chain;
    };

    const mockFrom = vi.fn(() => createMockChain());

    return {
        auth: {
            getSession: vi.fn(),
            signInWithPassword: vi.fn(),
            autoRefreshToken: true,
            persistSession: true,
        },
        storage: {
            from: mockStorageFrom,
        },
        from: mockFrom,
    } as unknown as SupabaseClient;
};

export const mockPerson = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'participant',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: new Date().toISOString(),
};

export const mockEvent = {
    id: 1,
    title: 'Test Event',
    date: '2024-02-18',
    location: { id: 1, name: 'Test Location' },
    section: { name: 'Test Section' },
    event_people: [
        {
            person: {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                role: 'participant',
            },
        },
    ],
}; 