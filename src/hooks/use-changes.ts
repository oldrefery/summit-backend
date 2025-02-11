// src/hooks/use-changes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';

export function useChanges() {
  const { showError, showSuccess } = useToastContext();
  const queryClient = useQueryClient();

  const changesQuery = useQuery({
    queryKey: ['changes'],
    queryFn: async () => {
      try {
        return await api.changes.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
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
    },
    isLoading: changesQuery.isLoading,
    isError: changesQuery.isError,
    error: changesQuery.error,
    publishVersion,
  };
}
