// src/hooks/use-locations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import type { LocationFormData } from '@/types';
import { useToastContext } from '@/components/providers/toast-provider';

export function useLocations() {
  const { showError, showSuccess } = useToastContext();
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.locations.getAll(),
  });

  const queryClient = useQueryClient();

  const createLocation = useMutation({
    mutationFn: (location: LocationFormData) => api.locations.create(location),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      showSuccess('Location created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updateLocation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<LocationFormData>;
    }) => api.locations.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      showSuccess('Location updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteLocation = useMutation({
    mutationFn: (id: number) => api.locations.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      showSuccess('Location deleted successfully');
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
    createLocation,
    updateLocation,
    deleteLocation,
  };
}
