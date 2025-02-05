// src/hooks/use-markdown.ts
// src/hooks/use-markdown.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import type { MarkdownPage } from '@/types';

export function useMarkdownPages() {
  return useQuery({
    queryKey: ['markdown'],
    queryFn: () => api.markdown.getAll(),
  });
}

export function useMarkdownPage(slug: string) {
  return useQuery({
    queryKey: ['markdown', slug],
    queryFn: () => api.markdown.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateMarkdownPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      page: Omit<MarkdownPage, 'id' | 'created_at' | 'updated_at'>
    ) => api.markdown.create(page),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markdown'] });
    },
  });
}

export function useUpdateMarkdownPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<Omit<MarkdownPage, 'id' | 'created_at' | 'updated_at'>>;
    }) => api.markdown.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markdown'] });
    },
  });
}

export function useDeleteMarkdownPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.markdown.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markdown'] });
    },
  });
}
