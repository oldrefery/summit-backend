// src/hooks/use-sections.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Section } from '@/types';

export function useSections() {
  const { showError, showSuccess } = useToastContext();
  const queryClient = useQueryClient();

  const sectionsQuery = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      try {
        return await api.sections.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  const createSection = useMutation({
    mutationFn: (section: Omit<Section, 'id' | 'created_at'>) =>
      api.sections.create(section),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      showSuccess('Section created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updateSection = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<Section, 'id' | 'created_at'>>;
    }) => api.sections.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      showSuccess('Section updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteSection = useMutation({
    mutationFn: api.sections.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      showSuccess('Section deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    data: sectionsQuery.data ?? [],
    isLoading: sectionsQuery.isLoading,
    error: sectionsQuery.error,
    createSection,
    updateSection,
    deleteSection,
  };
}
