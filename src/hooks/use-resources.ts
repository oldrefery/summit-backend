// src/hooks/use-resources.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Resource } from '@/types';

export type ResourceWithRelations = Resource;

export type ResourceFormData = Omit<Resource, 'id' | 'created_at'>;

export function useResources<T extends number | undefined = undefined>(id?: T) {
  const { showError, showSuccess } = useToastContext();
  const queryClient = useQueryClient();

  // Query for all resources
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

  // Query for single resource
  const resourceQuery = useQuery({
    queryKey: ['resources', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const resources = await api.resources.getAll();
        return resources.find(r => r.id === id) || null;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    enabled: !!id,
  });

  const createResource = useMutation({
    mutationFn: (resource: ResourceFormData) => api.resources.create(resource),
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
      data: Partial<ResourceFormData>;
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
    // Return single resource data if id is provided, otherwise return array
    data: (id ? resourceQuery.data : resourcesQuery.data ?? []) as T extends number ? ResourceWithRelations | null : ResourceWithRelations[],
    isLoading: id ? resourceQuery.isLoading : resourcesQuery.isLoading,
    isError: id ? resourceQuery.isError : resourcesQuery.isError,
    error: id ? resourceQuery.error : resourcesQuery.error,
    // CRUD operations
    createResource,
    updateResource,
    deleteResource,
  };
}
