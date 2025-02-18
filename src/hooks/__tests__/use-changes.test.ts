import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useChanges } from '../use-changes';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Changes } from '../use-changes';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        changes: {
            getAll: vi.fn(),
            publish: vi.fn(),
        },
    },
}));

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

describe('useChanges', () => {
    const mockChanges: Changes = {
        events: 2,
        people: 3,
        locations: 1,
        sections: 0,
        resources: 4,
        announcements: 1,
        social_posts: 2,
        markdown_pages: 1,
    };

    const mockToast = {
        showSuccess: vi.fn(),
        showError: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useToastContext as jest.Mock).mockReturnValue(mockToast);
        (api.changes.getAll as jest.Mock).mockResolvedValue(mockChanges);
        (api.changes.publish as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches changes', async () => {
        const { result } = renderHook(() => useChanges(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockChanges);
        expect(api.changes.getAll).toHaveBeenCalledTimes(1);
    });

    it('returns default values when no data is available', async () => {
        (api.changes.getAll as jest.Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useChanges(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual({
            events: 0,
            people: 0,
            locations: 0,
            sections: 0,
            resources: 0,
            announcements: 0,
            social_posts: 0,
            markdown_pages: 0,
        });
    });

    it('handles error when fetching changes', async () => {
        const error = new Error('Failed to fetch');
        (api.changes.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useChanges(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('publishes version successfully', async () => {
        const { result } = renderHook(() => useChanges(), {
            wrapper: Providers,
        });

        await result.current.publishVersion.mutateAsync();

        expect(api.changes.publish).toHaveBeenCalled();
        expect(mockToast.showSuccess).toHaveBeenCalledWith('New version published successfully');
    });

    it('handles error when publishing version', async () => {
        const error = new Error('Failed to publish');
        (api.changes.publish as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useChanges(), {
            wrapper: Providers,
        });

        await result.current.publishVersion.mutateAsync().catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 