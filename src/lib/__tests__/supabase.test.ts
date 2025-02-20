import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPerson, mockEvent, mockSession, mockAuthError, mockUser, mockStorageError } from './supabase.mocks';
import { supabase } from '../supabase';

const mockSignInWithPassword = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockGetSession = vi.hoisted(() => vi.fn());
const mockStorageFrom = vi.hoisted(() => vi.fn());
const mockDatabaseFrom = vi.hoisted(() => vi.fn());

vi.mock('@supabase/supabase-js', async () => {
    const actual = await vi.importActual('@supabase/supabase-js');
    return {
        ...actual,
    };
});

vi.mock('../supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: mockSignInWithPassword,
            signOut: mockSignOut,
            getSession: mockGetSession,
        },
        storage: {
            from: mockStorageFrom,
        },
        from: mockDatabaseFrom,
    },
}));

describe('Supabase Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup storage mocks
        mockStorageFrom.mockReturnValue({
            upload: vi.fn(),
            download: vi.fn(),
            remove: vi.fn(),
            list: vi.fn(),
        });

        // Setup database mocks
        mockDatabaseFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn(),
        });
    });

    describe('Authentication', () => {
        it('should sign in with email and password', async () => {
            const mockResponse = {
                data: {
                    user: mockUser,
                    session: mockSession,
                },
                error: null,
            };
            mockSignInWithPassword.mockResolvedValue(mockResponse);

            const result = await supabase.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'password',
            });

            expect(result).toEqual(mockResponse);
        });

        it('should handle sign in errors', async () => {
            const mockResponse = {
                data: {
                    user: null,
                    session: null,
                },
                error: mockAuthError,
            };
            mockSignInWithPassword.mockResolvedValue(mockResponse);

            const result = await supabase.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'wrong-password',
            });

            expect(result).toEqual(mockResponse);
        });
    });

    describe('Storage', () => {
        const bucket = 'avatars';
        const filePath = 'test-avatar.jpg';
        const mockFile = new File(['test'], filePath, { type: 'image/jpeg' });

        it('should upload file to storage', async () => {
            const mockResponse = {
                data: {
                    id: '123',
                    path: filePath,
                    fullPath: `${bucket}/${filePath}`,
                },
                error: null,
            };
            const mockUpload = vi.fn().mockResolvedValue(mockResponse);
            mockStorageFrom.mockReturnValue({ upload: mockUpload });

            const result = await supabase.storage.from(bucket).upload(filePath, mockFile);

            expect(result).toEqual(mockResponse);
            expect(mockUpload).toHaveBeenCalledWith(filePath, mockFile);
        });

        it('should handle upload errors', async () => {
            const mockResponse = {
                data: null,
                error: mockStorageError,
            };
            const mockUpload = vi.fn().mockResolvedValue(mockResponse);
            mockStorageFrom.mockReturnValue({ upload: mockUpload });

            const result = await supabase.storage.from(bucket).upload(filePath, mockFile);

            expect(result).toEqual(mockResponse);
        });
    });

    describe('Database Operations', () => {
        describe('People', () => {
            const table = 'people';

            it('should fetch all people', async () => {
                const mockResponse = { data: [mockPerson], error: null };
                const mockOrder = vi.fn().mockResolvedValue(mockResponse);
                mockDatabaseFrom.mockReturnValue({
                    select: vi.fn().mockReturnThis(),
                    order: mockOrder,
                });

                const result = await supabase.from(table).select('*').order('name', { ascending: true });

                expect(result).toEqual(mockResponse);
                expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
            });

            it('should create a new person', async () => {
                const newPerson = { ...mockPerson, id: undefined };
                const mockResponse = { data: mockPerson, error: null };
                const mockSingle = vi.fn().mockResolvedValue(mockResponse);
                mockDatabaseFrom.mockReturnValue({
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: mockSingle,
                });

                const result = await supabase.from(table).insert(newPerson).select('*').single();

                expect(result).toEqual(mockResponse);
                expect(mockSingle).toHaveBeenCalled();
            });

            it('should update a person', async () => {
                const updates = { name: 'Jane Doe' };
                const updatedPerson = { ...mockPerson, ...updates };
                const mockResponse = { data: updatedPerson, error: null };
                const mockSingle = vi.fn().mockResolvedValue(mockResponse);
                mockDatabaseFrom.mockReturnValue({
                    update: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: mockSingle,
                });

                const result = await supabase.from(table).update(updates).eq('id', mockPerson.id).select('*').single();

                expect(result).toEqual(mockResponse);
                expect(mockSingle).toHaveBeenCalled();
            });

            it('should delete a person', async () => {
                const mockResponse = { data: null, error: null };
                const mockEq = vi.fn().mockResolvedValue(mockResponse);
                mockDatabaseFrom.mockReturnValue({
                    delete: vi.fn().mockReturnThis(),
                    eq: mockEq,
                });

                const result = await supabase.from(table).delete().eq('id', mockPerson.id);

                expect(result).toEqual(mockResponse);
                expect(mockEq).toHaveBeenCalledWith('id', mockPerson.id);
            });
        });

        describe('Events', () => {
            const table = 'events';

            it('should fetch all events', async () => {
                const mockResponse = { data: [mockEvent], error: null };
                const mockOrder = vi.fn().mockResolvedValue(mockResponse);
                mockDatabaseFrom.mockReturnValue({
                    select: vi.fn().mockReturnThis(),
                    order: mockOrder,
                });

                const result = await supabase.from(table)
                    .select(`
                        id,
                        title,
                        date,
                        location:locations(id, name),
                        section:sections(name),
                        event_people(
                            person:people(id, name, email, role)
                        )
                    `)
                    .order('date', { ascending: true });

                expect(result).toEqual(mockResponse);
                expect(mockOrder).toHaveBeenCalledWith('date', { ascending: true });
            });
        });
    });
}); 