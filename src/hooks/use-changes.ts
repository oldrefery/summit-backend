// src/hooks/use-changes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';

export interface Changes {
  events: number;
  people: number;
  locations: number;
  sections: number;
  resources: number;
  announcements: number;
  social_posts: number;
  markdown_pages: number;
}

export type ChangesWithRelations = Changes;

export function useChanges() {
  const { showError, showSuccess } = useToastContext();
  const queryClient = useQueryClient();

  const changesQuery = useQuery({
    queryKey: ['changes'],
    queryFn: async () => {
      try {
        const result = await api.changes.getAll();
        console.log('Changes API response:', result);
        return result;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const publishVersion = useMutation({
    mutationFn: async () => {
      try {
        return await api.changes.publish();
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['changes'] });
      showSuccess('New version published successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    data: changesQuery.data ?? {
      events: 0,
      people: 0,
      locations: 0,
      sections: 0,
      resources: 0,
      announcements: 0,
      social_posts: 0,
      markdown_pages: 0,
    } as ChangesWithRelations,
    isLoading: changesQuery.isLoading,
    isError: changesQuery.isError,
    error: changesQuery.error,
    publishVersion,
  };
}
