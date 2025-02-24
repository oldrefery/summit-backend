// src/hooks/use-versions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Version } from '@/types/versions';

export type VersionWithRelations = Version;

export function useVersions() {
  const { showError, showSuccess } = useToastContext();
  const queryClient = useQueryClient();

  const versionsQuery = useQuery({
    queryKey: ['versions'],
    queryFn: async () => {
      try {
        return await api.versions.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  const rollbackVersion = useMutation({
    mutationFn: (version: string) => api.versions.rollback(version),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['versions'] });
      showSuccess('Version rollback successful');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteVersion = useMutation({
    mutationFn: (id: string) => api.versions.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['versions'] });
      showSuccess('Version deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    data: versionsQuery.data ?? [] as VersionWithRelations[],
    isLoading: versionsQuery.isLoading,
    isError: versionsQuery.isError,
    error: versionsQuery.error,
    rollbackVersion,
    deleteVersion,
  };
}
