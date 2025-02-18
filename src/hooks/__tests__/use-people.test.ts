import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { usePeople } from '../use-people';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Person, PersonRole } from '@/types';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        people: {
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

describe('usePeople', () => {
    const mockPeople: Person[] = [
        { id: 1, name: 'John Doe', role: 'speaker' as PersonRole, created_at: new Date().toISOString() },
        { id: 2, name: 'Jane Smith', role: 'attendee' as PersonRole, created_at: new Date().toISOString() },
    ];

    const mockToast = {
        showSuccess: vi.fn(),
        showError: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useToastContext as jest.Mock).mockReturnValue(mockToast);
        (api.people.getAll as jest.Mock).mockResolvedValue(mockPeople);
        (api.people.create as jest.Mock).mockImplementation((data) =>
            Promise.resolve({ id: 3, ...data, created_at: new Date().toISOString() }));
        (api.people.update as jest.Mock).mockImplementation((id, data) =>
            Promise.resolve({ ...mockPeople[0], ...data }));
        (api.people.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches all people', async () => {
        const { result } = renderHook(() => usePeople(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockPeople);
        expect(api.people.getAll).toHaveBeenCalledTimes(1);
    });

    it('fetches single person by id', async () => {
        const { result } = renderHook(() => usePeople(1), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockPeople[0]);
    });

    it('handles error when fetching people', async () => {
        const error = new Error('Failed to fetch');
        (api.people.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => usePeople(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('creates a person successfully', async () => {
        const newPerson = { name: 'New Person', role: 'speaker' as PersonRole };

        const { result } = renderHook(() => usePeople(), {
            wrapper: Providers,
        });

        await result.current.createPerson.mutateAsync(newPerson);

        expect(api.people.create).toHaveBeenCalledWith(newPerson);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Person created successfully');
    });

    it('updates a person successfully', async () => {
        const updateData = { name: 'Updated Name' };

        const { result } = renderHook(() => usePeople(), {
            wrapper: Providers,
        });

        await result.current.updatePerson.mutateAsync({ id: 1, data: updateData });

        expect(api.people.update).toHaveBeenCalledWith(1, updateData);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Person updated successfully');
    });

    it('deletes a person successfully', async () => {
        const { result } = renderHook(() => usePeople(), {
            wrapper: Providers,
        });

        await result.current.deletePerson.mutateAsync(1);

        expect(api.people.delete).toHaveBeenCalledWith(1);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Person deleted successfully');
    });

    it('handles error when creating person', async () => {
        const error = new Error('Failed to create');
        (api.people.create as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => usePeople(), {
            wrapper: Providers,
        });

        await result.current.createPerson.mutateAsync({ name: 'Test', role: 'speaker' as PersonRole }).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when updating person', async () => {
        const error = new Error('Failed to update');
        (api.people.update as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => usePeople(), {
            wrapper: Providers,
        });

        await result.current.updatePerson.mutateAsync({ id: 1, data: { name: 'Test' } }).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when deleting person', async () => {
        const error = new Error('Failed to delete');
        (api.people.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => usePeople(), {
            wrapper: Providers,
        });

        await result.current.deletePerson.mutateAsync(1).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 