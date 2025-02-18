// src/hooks/use-announcements.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Announcement, Person } from '@/types';

export type AnnouncementWithRelations = Announcement & { person: Person };

export type AnnouncementFormData = Omit<Announcement, 'id' | 'created_at'>;

export function useAnnouncements<T extends number | undefined = undefined>(id?: T) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToastContext();

  // Query for all announcements
  const announcementsQuery = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      try {
        return await api.announcements.getAll();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  // Query for single announcement
  const announcementQuery = useQuery({
    queryKey: ['announcements', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await api.announcements.getById(id);
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    enabled: !!id,
  });

  const createAnnouncement = useMutation({
    mutationFn: (announcement: AnnouncementFormData) => api.announcements.create(announcement),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showSuccess('Announcement created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<AnnouncementFormData>;
    }) => api.announcements.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showSuccess('Announcement updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: number) => api.announcements.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showSuccess('Announcement deleted successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  return {
    // Return single announcement data if id is provided, otherwise return array
    data: (id ? announcementQuery.data : announcementsQuery.data ?? []) as T extends number ? AnnouncementWithRelations | null : AnnouncementWithRelations[],
    isLoading: id ? announcementQuery.isLoading : announcementsQuery.isLoading,
    isError: id ? announcementQuery.isError : announcementsQuery.isError,
    error: id ? announcementQuery.error : announcementsQuery.error,
    // CRUD operations
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
}
