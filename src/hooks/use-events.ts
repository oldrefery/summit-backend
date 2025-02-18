// src/hooks/use-query.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Event, EventPerson, Person } from '@/types';
import type { EventFormData } from '@/types';

export type EventWithRelations = Event & {
  location: Location | null;
  event_people: (EventPerson & { person: Person })[];
};

export function useEvents<T extends number | undefined = undefined>(id?: T) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToastContext();

  // Query for all events
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        return await api.events.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  // Query for single event
  const eventQuery = useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await api.events.getById(id);
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    enabled: !!id,
  });

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
    mutationFn: api.events.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      showSuccess('Event deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    // Return single event data if id is provided, otherwise return array
    data: (id ? eventQuery.data : eventsQuery.data ?? []) as T extends number ? EventWithRelations | null : EventWithRelations[],
    isLoading: id ? eventQuery.isLoading : eventsQuery.isLoading,
    isError: id ? eventQuery.isError : eventsQuery.isError,
    error: id ? eventQuery.error : eventsQuery.error,
    // CRUD operations
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
