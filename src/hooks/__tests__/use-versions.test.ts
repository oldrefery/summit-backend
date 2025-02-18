import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useVersions } from '../use-versions';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Version } from '../use-versions';

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
            id: 1,
            version: '1.0.0',
            created_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            changes: {
                pages: 5,
                events: 3,
            },
            file_url: 'https://example.com/v1.0.0.zip',
        },
        {
            id: 2,
            version: '1.1.0',
            created_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            changes: {
                pages: 2,
                events: 1,
            },
            file_url: 'https://example.com/v1.1.0.zip',
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

        await result.current.rollbackVersion.mutateAsync('1.0.0');

        expect(api.versions.rollback).toHaveBeenCalledWith('1.0.0');
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Version rollback successful');
    });

    it('handles error when rolling back version', async () => {
        const error = new Error('Failed to rollback');
        (api.versions.rollback as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await result.current.rollbackVersion.mutateAsync('1.0.0').catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('deletes version successfully', async () => {
        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await result.current.deleteVersion.mutateAsync('1.0.0');

        expect(api.versions.delete).toHaveBeenCalledWith('1.0.0');
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Version deleted successfully');
    });

    it('handles error when deleting version', async () => {
        const error = new Error('Failed to delete');
        (api.versions.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useVersions(), {
            wrapper: Providers,
        });

        await result.current.deleteVersion.mutateAsync('1.0.0').catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 