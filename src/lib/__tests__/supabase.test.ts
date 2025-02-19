import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient, mockPerson, mockEvent } from './supabase.mocks';
import { supabase } from '../supabase';

// Mock Supabase client
vi.mock('../supabase', () => ({
    supabase: createMockSupabaseClient(),
}));

// Mock environment variables
vi.mock('process', () => ({
    env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
        SUPABASE_ANON_EMAIL: 'test@example.com',
        SUPABASE_ANON_PASSWORD: 'test-password',
    },
}));

describe('Supabase Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Authentication', () => {
        it('should sign in with email and password', async () => {
            const mockSession = { user: { id: '1', email: 'test@example.com' } };
            (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { session: mockSession }, error: null });

            const result = await supabase.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'password',
            });

            expect(result.data.session).toEqual(mockSession);
            expect(result.error).toBeNull();
        });

        it('should handle sign in errors', async () => {
            const mockError = { message: 'Invalid credentials' };
            (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { session: null }, error: mockError });

            const result = await supabase.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'wrong-password',
            });

            expect(result.data.session).toBeNull();
            expect(result.error).toEqual(mockError);
        });
    });

    describe('Storage', () => {
        const bucket = 'avatars';
        const filePath = 'test-avatar.jpg';
        const mockFile = new File(['test'], filePath, { type: 'image/jpeg' });

        it('should upload file to storage', async () => {
            const mockUploadResponse = { data: { path: filePath }, error: null };
            const mockUpload = vi.fn().mockResolvedValue(mockUploadResponse);
            const mockStorageFrom = vi.fn(() => ({ upload: mockUpload }));
            (supabase.storage.from as any) = mockStorageFrom;

            const result = await supabase.storage.from(bucket).upload(filePath, mockFile);

            expect(result).toEqual(mockUploadResponse);
            expect(mockStorageFrom).toHaveBeenCalledWith(bucket);
            expect(mockUpload).toHaveBeenCalledWith(filePath, mockFile);
        });

        it('should handle upload errors', async () => {
            const mockError = { message: 'Upload failed' };
            const mockUploadResponse = { data: null, error: mockError };
            const mockUpload = vi.fn().mockResolvedValue(mockUploadResponse);
            const mockStorageFrom = vi.fn(() => ({ upload: mockUpload }));
            (supabase.storage.from as any) = mockStorageFrom;

            const result = await supabase.storage.from(bucket).upload(filePath, mockFile);

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });
    });

    describe('Database Operations', () => {
        describe('People', () => {
            const table = 'people';

            it('should fetch all people', async () => {
                const mockPeople = [mockPerson];
                const mockResponse = { data: mockPeople, error: null };
                const mockOrder = vi.fn().mockResolvedValue(mockResponse);
                const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
                const mockFrom = vi.fn(() => ({ select: mockSelect }));
                (supabase.from as any) = mockFrom;

                const result = await supabase.from(table).select('*').order('name', { ascending: true });

                expect(result).toEqual(mockResponse);
                expect(mockFrom).toHaveBeenCalledWith(table);
                expect(mockSelect).toHaveBeenCalledWith('*');
                expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
            });

            it('should create a new person', async () => {
                const newPerson = { ...mockPerson, id: undefined };
                const mockResponse = { data: mockPerson, error: null };
                const mockSingle = vi.fn().mockResolvedValue(mockResponse);
                const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
                const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
                const mockFrom = vi.fn(() => ({ insert: mockInsert }));
                (supabase.from as any) = mockFrom;

                const result = await supabase.from(table).insert(newPerson).select('*').single();

                expect(result).toEqual(mockResponse);
                expect(mockFrom).toHaveBeenCalledWith(table);
                expect(mockInsert).toHaveBeenCalledWith(newPerson);
                expect(mockSelect).toHaveBeenCalledWith('*');
                expect(mockSingle).toHaveBeenCalled();
            });

            it('should update a person', async () => {
                const updates = { name: 'Jane Doe' };
                const updatedPerson = { ...mockPerson, ...updates };
                const mockResponse = { data: updatedPerson, error: null };
                const mockSingle = vi.fn().mockResolvedValue(mockResponse);
                const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
                const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
                const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
                const mockFrom = vi.fn(() => ({ update: mockUpdate }));
                (supabase.from as any) = mockFrom;

                const result = await supabase.from(table).update(updates).eq('id', mockPerson.id).select('*').single();

                expect(result).toEqual(mockResponse);
                expect(mockFrom).toHaveBeenCalledWith(table);
                expect(mockUpdate).toHaveBeenCalledWith(updates);
                expect(mockEq).toHaveBeenCalledWith('id', mockPerson.id);
                expect(mockSelect).toHaveBeenCalledWith('*');
                expect(mockSingle).toHaveBeenCalled();
            });

            it('should delete a person', async () => {
                const mockResponse = { data: null, error: null };
                const mockEq = vi.fn().mockResolvedValue(mockResponse);
                const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
                const mockFrom = vi.fn(() => ({ delete: mockDelete }));
                (supabase.from as any) = mockFrom;

                const result = await supabase.from(table).delete().eq('id', mockPerson.id);

                expect(result).toEqual(mockResponse);
                expect(mockFrom).toHaveBeenCalledWith(table);
                expect(mockDelete).toHaveBeenCalled();
                expect(mockEq).toHaveBeenCalledWith('id', mockPerson.id);
            });
        });

        describe('Events', () => {
            const table = 'events';

            it('should fetch all events', async () => {
                const mockEvents = [mockEvent];
                const mockResponse = { data: mockEvents, error: null };
                const mockOrder = vi.fn().mockResolvedValue(mockResponse);
                const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
                const mockFrom = vi.fn(() => ({ select: mockSelect }));
                (supabase.from as any) = mockFrom;

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
                expect(mockFrom).toHaveBeenCalledWith(table);
                expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id'));
                expect(mockOrder).toHaveBeenCalledWith('date', { ascending: true });
            });
        });
    });
}); 