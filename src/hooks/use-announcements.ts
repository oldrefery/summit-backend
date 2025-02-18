// src/hooks/use-announcements.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
        const { data, error } = await supabase
          .from('announcements')
          .select('*, person:people(*)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AnnouncementWithRelations[];
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
        const { data, error } = await supabase
          .from('announcements')
          .select('*, person:people(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as AnnouncementWithRelations;
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    enabled: !!id,
  });

  const createAnnouncement = useMutation({
    mutationFn: async (announcement: AnnouncementFormData) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert([announcement])
        .select('*, person:people(*)')
        .single();

      if (error) throw error;
      return data as AnnouncementWithRelations;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showSuccess('Announcement created successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<AnnouncementFormData>;
    }) => {
      const { data: updatedData, error } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', id)
        .select('*, person:people(*)')
        .single();

      if (error) throw error;
      return updatedData as AnnouncementWithRelations;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showSuccess('Announcement updated successfully');
    },
    onError: error => {
      showError(error);
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
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
