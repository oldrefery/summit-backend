import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useMarkdownPages } from '../use-markdown';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { MarkdownPage } from '@/types';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        markdown: {
            getAll: vi.fn(),
            getBySlug: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

describe('useMarkdownPages', () => {
    const mockPages: MarkdownPage[] = [
        {
            id: 1,
            slug: 'welcome',
            title: 'Welcome Page',
            content: '# Welcome\nThis is the welcome page.',
            published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 2,
            slug: 'about',
            title: 'About Page',
            content: '# About\nThis is the about page.',
            published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    const mockToast = {
        showSuccess: vi.fn(),
        showError: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useToastContext as jest.Mock).mockReturnValue(mockToast);
        (api.markdown.getAll as jest.Mock).mockResolvedValue(mockPages);
        (api.markdown.getBySlug as jest.Mock).mockImplementation((slug: string) =>
            Promise.resolve(mockPages.find(page => page.slug === slug)));
        (api.markdown.create as jest.Mock).mockImplementation((data) =>
            Promise.resolve({ id: 3, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
        (api.markdown.update as jest.Mock).mockImplementation((id, data) =>
            Promise.resolve({ ...mockPages[0], ...data, updated_at: new Date().toISOString() }));
        (api.markdown.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches all markdown pages', async () => {
        const { result } = renderHook(() => useMarkdownPages(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockPages);
        expect(api.markdown.getAll).toHaveBeenCalledTimes(1);
    });

    it('fetches single markdown page by slug', async () => {
        const { result } = renderHook(() => useMarkdownPages('welcome'), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockPages[0]);
        expect(api.markdown.getBySlug).toHaveBeenCalledWith('welcome');
    });

    it('handles error when fetching markdown pages', async () => {
        const error = new Error('Failed to fetch');
        (api.markdown.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useMarkdownPages(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('creates a markdown page successfully', async () => {
        const newPage = {
            slug: 'new-page',
            title: 'New Page',
            content: '# New Page\nThis is a new page.',
            published: true,
        };

        const { result } = renderHook(() => useMarkdownPages(), {
            wrapper: Providers,
        });

        await result.current.createMarkdownPage.mutateAsync(newPage);

        expect(api.markdown.create).toHaveBeenCalledWith(newPage);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Page created successfully');
    });

    it('updates a markdown page successfully', async () => {
        const updateData = {
            title: 'Updated Page',
            content: '# Updated Page\nThis page has been updated.',
        };

        const { result } = renderHook(() => useMarkdownPages(), {
            wrapper: Providers,
        });

        await result.current.updateMarkdownPage.mutateAsync({ id: 1, data: updateData });

        expect(api.markdown.update).toHaveBeenCalledWith(1, updateData);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Page updated successfully');
    });

    it('deletes a markdown page successfully', async () => {
        const { result } = renderHook(() => useMarkdownPages(), {
            wrapper: Providers,
        });

        await result.current.deleteMarkdownPage.mutateAsync(1);

        expect(api.markdown.delete).toHaveBeenCalledWith(1);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Page deleted successfully');
    });

    it('handles error when creating markdown page', async () => {
        const error = new Error('Failed to create');
        (api.markdown.create as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useMarkdownPages(), {
            wrapper: Providers,
        });

        const newPage = {
            slug: 'new-page',
            title: 'New Page',
            content: '# New Page\nThis is a new page.',
            published: true,
        };

        await result.current.createMarkdownPage.mutateAsync(newPage).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when updating markdown page', async () => {
        const error = new Error('Failed to update');
        (api.markdown.update as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useMarkdownPages(), {
            wrapper: Providers,
        });

        await result.current.updateMarkdownPage.mutateAsync({
            id: 1,
            data: { title: 'Updated Page' },
        }).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when deleting markdown page', async () => {
        const error = new Error('Failed to delete');
        (api.markdown.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useMarkdownPages(), {
            wrapper: Providers,
        });

        await result.current.deleteMarkdownPage.mutateAsync(1).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 