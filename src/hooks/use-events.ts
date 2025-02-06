// src/hooks/use-events.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import type { EventFormData } from '@/types';
import { useToastContext } from '@/components/providers/toast-provider';

export function useEvents() {
  const { showError, showSuccess } = useToastContext();
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.events.getAll(),
  });

  const queryClient = useQueryClient();

  const createEvent = useMutation({
    mutationFn: (event: EventFormData) => api.events.create(event),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      showSuccess('Event created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updateEvent = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<EventFormData>;
    }) => api.events.update(id, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      showSuccess('Event updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (id: number) => api.events.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      showSuccess('Event deleted successfully');
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
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => api.events.getById(id),
    enabled: !!id,
  });
}
