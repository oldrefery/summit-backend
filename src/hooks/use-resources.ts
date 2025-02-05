// src/hooks/use-resources.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { Resource } from '@/types';

export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: () => api.resources.getAll(),
  });
}

export function useResource(id: number) {
  return useQuery({
    queryKey: ['resources', id],
    queryFn: () => api.resources.getById(id),
    enabled: !!id,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resource: Omit<Resource, 'id' | 'created_at'>) =>
      api.resources.create(resource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<Omit<Resource, 'id' | 'created_at'>>;
    }) => api.resources.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.resources.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}
