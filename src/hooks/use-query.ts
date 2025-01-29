import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Person } from '@/lib/supabase';

export function usePeople() {
  const queryClient = useQueryClient();

  const peopleQuery = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      console.log('Fetching people...');
      const data = await api.people.getAll();
      console.log('Fetched data:', data);
      return data;
    },
  });

  const createPerson = useMutation({
    mutationFn: api.people.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
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
    },
  });

  const deletePerson = useMutation({
    mutationFn: api.people.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
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
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: () => api.events.getAll(),
  });

  return {
    data: eventsQuery.data ?? [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
  };
}

// Добавим другие хуки по мере необходимости
