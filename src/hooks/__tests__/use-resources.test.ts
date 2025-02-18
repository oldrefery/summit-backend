import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useResources } from '../use-resources';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Resource } from '@/types';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        resources: {
            getAll: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

describe('useResources', () => {
    const mockResources: Resource[] = [
        {
            id: 1,
            name: 'Conference Schedule',
            link: 'https://example.com/schedule',
            description: 'Full conference schedule',
            is_route: false,
            created_at: new Date().toISOString(),
        },
        {
            id: 2,
            name: 'Speaker Guidelines',
            link: 'https://example.com/guidelines',
            description: 'Guidelines for speakers',
            is_route: true,
            created_at: new Date().toISOString(),
        },
    ];

    const mockToast = {
        showSuccess: vi.fn(),
        showError: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useToastContext as jest.Mock).mockReturnValue(mockToast);
        (api.resources.getAll as jest.Mock).mockResolvedValue(mockResources);
        (api.resources.create as jest.Mock).mockImplementation((data) =>
            Promise.resolve({ id: 3, ...data, created_at: new Date().toISOString() }));
        (api.resources.update as jest.Mock).mockImplementation((id, data) =>
            Promise.resolve({ ...mockResources[0], ...data }));
        (api.resources.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches all resources', async () => {
        const { result } = renderHook(() => useResources(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockResources);
        expect(api.resources.getAll).toHaveBeenCalledTimes(1);
    });

    it('fetches single resource by id', async () => {
        const { result } = renderHook(() => useResources(1), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockResources[0]);
    });

    it('handles error when fetching resources', async () => {
        const error = new Error('Failed to fetch');
        (api.resources.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useResources(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('creates a resource successfully', async () => {
        const newResource = {
            name: 'New Resource',
            link: 'https://example.com/new',
            description: 'New resource description',
            is_route: false,
        };

        const { result } = renderHook(() => useResources(), {
            wrapper: Providers,
        });

        await result.current.createResource.mutateAsync(newResource);

        expect(api.resources.create).toHaveBeenCalledWith(newResource);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Resource created successfully');
    });

    it('updates a resource successfully', async () => {
        const updateData = {
            name: 'Updated Resource',
            description: 'Updated description',
        };

        const { result } = renderHook(() => useResources(), {
            wrapper: Providers,
        });

        await result.current.updateResource.mutateAsync({ id: 1, data: updateData });

        expect(api.resources.update).toHaveBeenCalledWith(1, updateData);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Resource updated successfully');
    });

    it('deletes a resource successfully', async () => {
        const { result } = renderHook(() => useResources(), {
            wrapper: Providers,
        });

        await result.current.deleteResource.mutateAsync(1);

        expect(api.resources.delete).toHaveBeenCalledWith(1);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Resource deleted successfully');
    });

    it('handles error when creating resource', async () => {
        const error = new Error('Failed to create');
        (api.resources.create as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useResources(), {
            wrapper: Providers,
        });

        const newResource = {
            name: 'New Resource',
            link: 'https://example.com/new',
            description: 'New resource description',
            is_route: false,
        };

        await result.current.createResource.mutateAsync(newResource).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when updating resource', async () => {
        const error = new Error('Failed to update');
        (api.resources.update as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useResources(), {
            wrapper: Providers,
        });

        await result.current.updateResource.mutateAsync({
            id: 1,
            data: { name: 'Updated Resource' },
        }).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when deleting resource', async () => {
        const error = new Error('Failed to delete');
        (api.resources.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useResources(), {
            wrapper: Providers,
        });

        await result.current.deleteResource.mutateAsync(1).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 