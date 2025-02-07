// src/hooks/use-markdown.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import type { MarkdownPage } from '@/types';
import { useToastContext } from '@/components/providers/toast-provider';

interface MarkdownPageFormData
  extends Omit<MarkdownPage, 'id' | 'created_at' | 'updated_at'> {
  slug: string;
  title: string;
  content: string;
  published: boolean;
}

export function useMarkdownPages() {
  const { showError, showSuccess } = useToastContext();
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['pages'],
    queryFn: () => api.markdown.getAll(),
  });

  const queryClient = useQueryClient();

  const createMarkdownPage = useMutation({
    mutationFn: (page: MarkdownPageFormData) => api.markdown.create(page),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pages'] });
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
      await queryClient.invalidateQueries({ queryKey: ['pages'] });
      showSuccess('Page updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteMarkdownPage = useMutation({
    mutationFn: (id: number) => api.markdown.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pages'] });
      showSuccess('Page deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    data,
    isLoading,
    isError,
    error,
    createMarkdownPage,
    updateMarkdownPage,
    deleteMarkdownPage,
  };
}

export function useMarkdownPage(slug: string) {
  return useQuery({
    queryKey: ['pages', slug],
    queryFn: () => api.markdown.getBySlug(slug),
    enabled: !!slug,
  });
}
