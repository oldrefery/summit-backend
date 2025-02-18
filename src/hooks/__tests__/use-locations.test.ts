import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useLocations } from '../use-locations';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Location } from '@/types';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        locations: {
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

describe('useLocations', () => {
    const mockLocations: Location[] = [
        {
            id: 1,
            name: 'Main Hall',
            link_map: 'https://maps.example.com/main-hall',
            link: 'https://example.com/main-hall',
            link_address: '123 Main St',
            created_at: new Date().toISOString(),
        },
        {
            id: 2,
            name: 'Conference Room A',
            link_map: 'https://maps.example.com/room-a',
            link: 'https://example.com/room-a',
            link_address: '123 Main St, Room A',
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
        (api.locations.getAll as jest.Mock).mockResolvedValue(mockLocations);
        (api.locations.create as jest.Mock).mockImplementation((data) =>
            Promise.resolve({ id: 3, ...data, created_at: new Date().toISOString() }));
        (api.locations.update as jest.Mock).mockImplementation((id, data) =>
            Promise.resolve({ ...mockLocations[0], ...data }));
        (api.locations.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches all locations', async () => {
        const { result } = renderHook(() => useLocations(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockLocations);
        expect(api.locations.getAll).toHaveBeenCalledTimes(1);
    });

    it('fetches single location by id', async () => {
        const { result } = renderHook(() => useLocations(1), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockLocations[0]);
    });

    it('handles error when fetching locations', async () => {
        const error = new Error('Failed to fetch');
        (api.locations.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useLocations(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('creates a location successfully', async () => {
        const newLocation = {
            name: 'New Location',
            link_map: 'https://maps.example.com/new',
            link: 'https://example.com/new',
            link_address: '456 New St',
        };

        const { result } = renderHook(() => useLocations(), {
            wrapper: Providers,
        });

        await result.current.createLocation.mutateAsync(newLocation);

        expect(api.locations.create).toHaveBeenCalledWith(newLocation);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Location created successfully');
    });

    it('updates a location successfully', async () => {
        const updateData = {
            name: 'Updated Location',
            link_address: '789 Updated St',
        };

        const { result } = renderHook(() => useLocations(), {
            wrapper: Providers,
        });

        await result.current.updateLocation.mutateAsync({ id: 1, data: updateData });

        expect(api.locations.update).toHaveBeenCalledWith(1, updateData);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Location updated successfully');
    });

    it('deletes a location successfully', async () => {
        const { result } = renderHook(() => useLocations(), {
            wrapper: Providers,
        });

        await result.current.deleteLocation.mutateAsync(1);

        expect(api.locations.delete).toHaveBeenCalledWith(1);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Location deleted successfully');
    });

    it('handles error when creating location', async () => {
        const error = new Error('Failed to create');
        (api.locations.create as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useLocations(), {
            wrapper: Providers,
        });

        const newLocation = {
            name: 'New Location',
            link_map: 'https://maps.example.com/new',
            link: 'https://example.com/new',
            link_address: '456 New St',
        };

        await result.current.createLocation.mutateAsync(newLocation).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when updating location', async () => {
        const error = new Error('Failed to update');
        (api.locations.update as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useLocations(), {
            wrapper: Providers,
        });

        await result.current.updateLocation.mutateAsync({
            id: 1,
            data: { name: 'Updated Location' },
        }).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when deleting location', async () => {
        const error = new Error('Failed to delete');
        (api.locations.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useLocations(), {
            wrapper: Providers,
        });

        await result.current.deleteLocation.mutateAsync(1).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 