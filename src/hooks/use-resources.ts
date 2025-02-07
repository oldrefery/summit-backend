// src/hooks/use-resources.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Resource } from '@/types';

export function useResources() {
  const { showError, showSuccess } = useToastContext();
  const queryClient = useQueryClient();

  const resourcesQuery = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      try {
        return await api.resources.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  const createResource = useMutation({
    mutationFn: (resource: Omit<Resource, 'id' | 'created_at'>) =>
      api.resources.create(resource),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      showSuccess('Resource created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updateResource = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<Resource, 'id' | 'created_at'>>;
    }) => api.resources.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      showSuccess('Resource updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteResource = useMutation({
    mutationFn: api.resources.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      showSuccess('Resource deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    data: resourcesQuery.data ?? [],
    isLoading: resourcesQuery.isLoading,
    isError: resourcesQuery.isError,
    error: resourcesQuery.error,
    createResource,
    updateResource,
    deleteResource,
  };
}
