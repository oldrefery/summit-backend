// src/hooks/use-locations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import type { Location } from '@/types';

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => api.locations.getAll(),
  });
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: () => api.locations.getById(id),
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (location: Omit<Location, 'id' | 'created_at'>) =>
      api.locations.create(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<Omit<Location, 'id' | 'created_at'>>;
    }) => api.locations.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.locations.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
