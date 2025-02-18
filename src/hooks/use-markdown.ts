// src/hooks/use-markdown.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { MarkdownPage } from '@/types';

export type MarkdownPageWithRelations = MarkdownPage;

export type MarkdownPageFormData = Omit<MarkdownPage, 'id' | 'created_at' | 'updated_at'>;

export function useMarkdownPages<T extends string | undefined = undefined>(slug?: T) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToastContext();

  // Query for all pages
  const pagesQuery = useQuery({
    queryKey: ['markdown_pages'],
    queryFn: async () => {
      try {
        return await api.markdown.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  // Query for single page by slug
  const pageQuery = useQuery({
    queryKey: ['markdown_pages', slug],
    queryFn: async () => {
      if (!slug) return null;
      try {
        return await api.markdown.getBySlug(slug);
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    enabled: !!slug,
  });

  const createMarkdownPage = useMutation({
    mutationFn: (page: MarkdownPageFormData) => api.markdown.create(page),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['markdown_pages'] });
      showSuccess('Page created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updateMarkdownPage = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<MarkdownPageFormData>;
    }) => api.markdown.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['markdown_pages'] });
      showSuccess('Page updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteMarkdownPage = useMutation({
    mutationFn: api.markdown.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['markdown_pages'] });
      showSuccess('Page deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    // Return single page data if slug is provided, otherwise return array
    data: (slug ? pageQuery.data : pagesQuery.data ?? []) as T extends string ? MarkdownPageWithRelations | null : MarkdownPageWithRelations[],
    isLoading: slug ? pageQuery.isLoading : pagesQuery.isLoading,
    isError: slug ? pageQuery.isError : pagesQuery.isError,
    error: slug ? pageQuery.error : pagesQuery.error,
    // CRUD operations
    createMarkdownPage,
    updateMarkdownPage,
    deleteMarkdownPage,
  };
}
