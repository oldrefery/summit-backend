import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useSections } from '../use-sections';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Section } from '@/types';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        sections: {
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

describe('useSections', () => {
    const mockSections: Section[] = [
        {
            id: 1,
            name: 'Morning Session',
            date: '2024-03-01',
            created_at: new Date().toISOString(),
        },
        {
            id: 2,
            name: 'Afternoon Session',
            date: '2024-03-01',
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
        (api.sections.getAll as jest.Mock).mockResolvedValue(mockSections);
        (api.sections.create as jest.Mock).mockImplementation((data) =>
            Promise.resolve({ id: 3, ...data, created_at: new Date().toISOString() }));
        (api.sections.update as jest.Mock).mockImplementation((id, data) =>
            Promise.resolve({ ...mockSections[0], ...data }));
        (api.sections.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches all sections', async () => {
        const { result } = renderHook(() => useSections(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockSections);
        expect(api.sections.getAll).toHaveBeenCalledTimes(1);
    });

    it('fetches single section by id', async () => {
        const { result } = renderHook(() => useSections(1), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockSections[0]);
    });

    it('handles error when fetching sections', async () => {
        const error = new Error('Failed to fetch');
        (api.sections.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useSections(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('creates a section successfully', async () => {
        const newSection = {
            name: 'Evening Session',
            date: '2024-03-01',
        };

        const { result } = renderHook(() => useSections(), {
            wrapper: Providers,
        });

        await result.current.createSection.mutateAsync(newSection);

        expect(api.sections.create).toHaveBeenCalledWith(newSection);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Section created successfully');
    });

    it('updates a section successfully', async () => {
        const updateData = {
            name: 'Updated Session',
        };

        const { result } = renderHook(() => useSections(), {
            wrapper: Providers,
        });

        await result.current.updateSection.mutateAsync({ id: 1, data: updateData });

        expect(api.sections.update).toHaveBeenCalledWith(1, updateData);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Section updated successfully');
    });

    it('deletes a section successfully', async () => {
        const { result } = renderHook(() => useSections(), {
            wrapper: Providers,
        });

        await result.current.deleteSection.mutateAsync(1);

        expect(api.sections.delete).toHaveBeenCalledWith(1);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Section deleted successfully');
    });

    it('handles error when creating section', async () => {
        const error = new Error('Failed to create');
        (api.sections.create as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useSections(), {
            wrapper: Providers,
        });

        const newSection = {
            name: 'Evening Session',
            date: '2024-03-01',
        };

        await result.current.createSection.mutateAsync(newSection).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when updating section', async () => {
        const error = new Error('Failed to update');
        (api.sections.update as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useSections(), {
            wrapper: Providers,
        });

        await result.current.updateSection.mutateAsync({
            id: 1,
            data: { name: 'Updated Session' },
        }).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when deleting section', async () => {
        const error = new Error('Failed to delete');
        (api.sections.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useSections(), {
            wrapper: Providers,
        });

        await result.current.deleteSection.mutateAsync(1).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 