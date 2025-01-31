import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Person } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';

export function usePeople() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToastContext();

  const peopleQuery = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      try {
        const data = await api.people.getAll();

        return data;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  const createPerson = useMutation({
    mutationFn: api.people.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      showSuccess('Person created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updatePerson = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<Person, 'id' | 'created_at'>>;
    }) => api.people.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      showSuccess('Person updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deletePerson = useMutation({
    mutationFn: api.people.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      showSuccess('Person deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    data: peopleQuery.data ?? [],
    isLoading: peopleQuery.isLoading,
    error: peopleQuery.error,
    createPerson,
    updatePerson,
    deletePerson,
  };
}

export function useEvents() {
  const { showError } = useToastContext();

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const data = await api.events.getAll();

        return data;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  return {
    data: eventsQuery.data ?? [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
  };
}
