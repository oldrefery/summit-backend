// src/hooks/use-locations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Location } from '@/types';
import type { LocationFormData } from '@/types';

export type LocationWithRelations = Location;

export function useLocations<T extends number | undefined = undefined>(id?: T) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToastContext();

  // Query for all locations
  const locationsQuery = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      try {
        return await api.locations.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  // Query for single location
  const locationQuery = useQuery({
    queryKey: ['locations', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const locations = await api.locations.getAll();
        return locations.find(l => l.id === id) || null;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    enabled: !!id,
  });

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
    mutationFn: api.locations.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      showSuccess('Location deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    // Return single location data if id is provided, otherwise return array
    data: (id ? locationQuery.data : locationsQuery.data ?? []) as T extends number ? LocationWithRelations | null : LocationWithRelations[],
    isLoading: id ? locationQuery.isLoading : locationsQuery.isLoading,
    isError: id ? locationQuery.isError : locationsQuery.isError,
    error: id ? locationQuery.error : locationsQuery.error,
    // CRUD operations
    createLocation,
    updateLocation,
    deleteLocation,
  };
}
