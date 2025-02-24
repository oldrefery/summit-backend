import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useVersions } from '../use-versions';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Version } from '@/types/versions';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        versions: {
            getAll: vi.fn(),
            rollback: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

describe('useVersions', () => {
    const mockVersions: Version[] = [
        {
            id: '1',
            version: '1',
            published_at: new Date().toISOString(),
            changes: {
                events: 3,
                people: 5,
                sections: 0,
                locations: 2,
                resources: 1,
                social_posts: 0,
                announcements: 1,
                markdown_pages: 2
            },
            file_url: 'https://example.com/v1.json',
            created_at: new Date().toISOString()
        },
        {
            id: '2',
            version: '2',
            published_at: new Date().toISOString(),
            changes: {
                events: 1,
                people: 2,
                sections: 1,
                locations: 0,
                resources: 1,
                social_posts: 1,
                announcements: 0,
                markdown_pages: 1
            },
            file_url: 'https://example.com/v2.json',
            created_at: new Date().toISOString()
        },
    ];

    const mockToast = {
        showSuccess: vi.fn(),
        showError: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useToastContext as jest.Mock).mockReturnValue(mockToast);
        (api.versions.getAll as jest.Mock).mockResolvedValue(mockVersions);
        (api.versions.rollback as jest.Mock).mockImplementation((version) =>
            Promise.resolve(mockVersions.find(v => v.version === version)));
        (api.versions.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches all versions', async () => {
        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockVersions);
        expect(api.versions.getAll).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no data is available', async () => {
        (api.versions.getAll as jest.Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
    });

    it('handles error when fetching versions', async () => {
        const error = new Error('Failed to fetch');
        (api.versions.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('rolls back version successfully', async () => {
        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await result.current.rollbackVersion.mutateAsync('1');

        expect(api.versions.rollback).toHaveBeenCalledWith('1');
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Version rollback successful');
    });

    it('handles error when rolling back version', async () => {
        const error = new Error('Failed to rollback');
        (api.versions.rollback as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await result.current.rollbackVersion.mutateAsync('1').catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('deletes version successfully', async () => {
        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await result.current.deleteVersion.mutateAsync('1');

        expect(api.versions.delete).toHaveBeenCalledWith('1');
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Version deleted successfully');
    });

    it('handles error when deleting version', async () => {
        const error = new Error('Failed to delete');
        (api.versions.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await result.current.deleteVersion.mutateAsync('1').catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 