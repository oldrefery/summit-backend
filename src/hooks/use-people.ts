import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Person } from '@/types';
import type { PersonFormData } from '@/types';

export type PersonWithRelations = Person;

export type UsePeopleReturn = {
    data: Person[] | null;
    isLoading: boolean;
    error: Error | null;
    createPerson: {
        mutateAsync: (person: PersonFormData) => Promise<Person>;
    };
};

export function usePeople<T extends number | undefined = undefined>(id?: T) {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToastContext();

    // Query for all people
    const peopleQuery = useQuery({
        queryKey: ['people'],
        queryFn: async () => {
            try {
                return await api.people.getAll();
            } catch (error) {
                showError(error);
                throw error;
            }
        },
    });

    // Query for single person
    const personQuery = useQuery({
        queryKey: ['people', id],
        queryFn: async () => {
            if (!id) return null;
            try {
                const people = await api.people.getAll();
                return people.find(p => p.id === id) || null;
            } catch (error) {
                showError(error);
                throw error;
            }
        },
        enabled: !!id,
    });

    const createPerson = useMutation({
        mutationFn: (person: PersonFormData) => api.people.create(person),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['people'] }),
                queryClient.invalidateQueries({ queryKey: ['changes'] })
            ]);
            await queryClient.refetchQueries({ queryKey: ['changes'] });
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
            data: Partial<PersonFormData>;
        }) => api.people.update(id, data),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['people'] }),
                queryClient.invalidateQueries({ queryKey: ['changes'] })
            ]);
            await queryClient.refetchQueries({ queryKey: ['changes'] });
            showSuccess('Person updated successfully');
        },
        onError: error => {
            showError(error);
        },
    });

    const deletePerson = useMutation({
        mutationFn: api.people.delete,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['people'] }),
                queryClient.invalidateQueries({ queryKey: ['changes'] })
            ]);
            await queryClient.refetchQueries({ queryKey: ['changes'] });
            showSuccess('Person deleted successfully');
        },
        onError: error => {
            showError(error);
        },
    });

    return {
        // Return single person data if id is provided, otherwise return array
        data: (id ? personQuery.data : peopleQuery.data ?? []) as T extends number ? PersonWithRelations | null : PersonWithRelations[],
        isLoading: id ? personQuery.isLoading : peopleQuery.isLoading,
        isError: id ? personQuery.isError : peopleQuery.isError,
        error: id ? personQuery.error : peopleQuery.error,
        // CRUD operations
        createPerson,
        updatePerson,
        deletePerson,
    };
} 