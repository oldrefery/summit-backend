// src/hooks/use-sections.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Section } from '@/types';

export type SectionWithRelations = Section;

export type SectionFormData = Omit<Section, 'id' | 'created_at'>;

export function useSections<T extends number | undefined = undefined>(id?: T) {
  const { showError, showSuccess } = useToastContext();
  const queryClient = useQueryClient();

  // Query for all sections
  const sectionsQuery = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      try {
        return await api.sections.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  // Query for single section
  const sectionQuery = useQuery({
    queryKey: ['sections', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const sections = await api.sections.getAll();
        return sections.find(s => s.id === id) || null;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    enabled: !!id,
  });

  const createSection = useMutation({
    mutationFn: (section: SectionFormData) => api.sections.create(section),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sections'] });
      showSuccess('Section created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updateSection = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<SectionFormData>;
    }) => api.sections.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sections'] });
      showSuccess('Section updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteSection = useMutation({
    mutationFn: api.sections.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sections'] });
      showSuccess('Section deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    // Return single section data if id is provided, otherwise return array
    data: (id ? sectionQuery.data : sectionsQuery.data ?? []) as T extends number ? SectionWithRelations | null : SectionWithRelations[],
    isLoading: id ? sectionQuery.isLoading : sectionsQuery.isLoading,
    isError: id ? sectionQuery.isError : sectionsQuery.isError,
    error: id ? sectionQuery.error : sectionsQuery.error,
    // CRUD operations
    createSection,
    updateSection,
    deleteSection,
  };
}
