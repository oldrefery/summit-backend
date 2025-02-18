import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { useAnnouncements } from '../use-announcements';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Person } from '@/types';
import type { AnnouncementWithRelations } from '../use-announcements';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        announcements: {
            getAll: vi.fn(),
            getById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

describe('useAnnouncements', () => {
    const mockPerson: Person = {
        id: 1,
        name: 'John Doe',
        role: 'speaker',
        created_at: new Date().toISOString(),
    };

    const mockAnnouncements: AnnouncementWithRelations[] = [
        {
            id: 1,
            person_id: 1,
            content: 'First announcement',
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            person: mockPerson,
        },
        {
            id: 2,
            person_id: 1,
            content: 'Second announcement',
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            person: mockPerson,
        },
    ];

    const mockToast = {
        showSuccess: vi.fn(),
        showError: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useToastContext as jest.Mock).mockReturnValue(mockToast);
        (api.announcements.getAll as jest.Mock).mockResolvedValue(mockAnnouncements);
        (api.announcements.getById as jest.Mock).mockResolvedValue(mockAnnouncements[0]);
        (api.announcements.create as jest.Mock).mockImplementation((data) =>
            Promise.resolve({ id: 3, ...data, created_at: new Date().toISOString(), person: mockPerson }));
        (api.announcements.update as jest.Mock).mockImplementation((id, data) =>
            Promise.resolve({ ...mockAnnouncements[0], ...data }));
        (api.announcements.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches all announcements', async () => {
        const { result } = renderHook(() => useAnnouncements(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockAnnouncements);
        expect(api.announcements.getAll).toHaveBeenCalledTimes(1);
    });

    it('fetches single announcement by id', async () => {
        const { result } = renderHook(() => useAnnouncements(1), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockAnnouncements[0]);
        expect(api.announcements.getById).toHaveBeenCalledWith(1);
    });

    it('handles error when fetching announcements', async () => {
        const error = new Error('Failed to fetch');
        (api.announcements.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useAnnouncements(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('creates an announcement successfully', async () => {
        const newAnnouncement = {
            person_id: 1,
            content: 'New announcement',
            published_at: new Date().toISOString(),
        };

        const { result } = renderHook(() => useAnnouncements(), {
            wrapper: Providers,
        });

        await result.current.createAnnouncement.mutateAsync(newAnnouncement);

        expect(api.announcements.create).toHaveBeenCalledWith(newAnnouncement);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Announcement created successfully');
    });

    it('updates an announcement successfully', async () => {
        const updateData = {
            content: 'Updated announcement',
        };

        const { result } = renderHook(() => useAnnouncements(), {
            wrapper: Providers,
        });

        await result.current.updateAnnouncement.mutateAsync({ id: 1, data: updateData });

        expect(api.announcements.update).toHaveBeenCalledWith(1, updateData);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Announcement updated successfully');
    });

    it('deletes an announcement successfully', async () => {
        const { result } = renderHook(() => useAnnouncements(), {
            wrapper: Providers,
        });

        await result.current.deleteAnnouncement.mutateAsync(1);

        expect(api.announcements.delete).toHaveBeenCalledWith(1);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Announcement deleted successfully');
    });

    it('handles error when creating announcement', async () => {
        const error = new Error('Failed to create');
        (api.announcements.create as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useAnnouncements(), {
            wrapper: Providers,
        });

        const newAnnouncement = {
            person_id: 1,
            content: 'New announcement',
            published_at: new Date().toISOString(),
        };

        await result.current.createAnnouncement.mutateAsync(newAnnouncement).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when updating announcement', async () => {
        const error = new Error('Failed to update');
        (api.announcements.update as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useAnnouncements(), {
            wrapper: Providers,
        });

        await result.current.updateAnnouncement.mutateAsync({
            id: 1,
            data: { content: 'Updated announcement' },
        }).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when deleting announcement', async () => {
        const error = new Error('Failed to delete');
        (api.announcements.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useAnnouncements(), {
            wrapper: Providers,
        });

        await result.current.deleteAnnouncement.mutateAsync(1).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 