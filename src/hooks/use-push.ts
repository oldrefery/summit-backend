// src/hooks/use-push.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { NotificationFormData } from '@/types/push';

export interface PushStatistics {
  active_tokens: number;
  active_users: number;
}

export interface PushNotification {
  id: number;
  title: string;
  body: string;
  sent_at: string;
  status: 'delivered' | 'failed';
  target_users: string[];
}

export interface PushUser {
  id: number;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
  last_active: string;
  device_info: {
    deviceName: string;
    osName: string;
  };
}

export interface NotificationHistory {
  id: number;
  title: string;
  body: string;
  sent_at: string;
  data: Record<string, unknown>;
  sent_by: string;
  target_type: 'all' | 'specific_users';
  target_users: string[];
  success_count: number;
  failure_count: number;
}

export type PushStatisticsWithRelations = PushStatistics;
export type PushNotificationWithRelations = PushNotification;
export type PushUserWithRelations = PushUser;

export function usePushStatistics() {
  const { showError } = useToastContext();

  const statisticsQuery = useQuery({
    queryKey: ['push_statistics'],
    queryFn: async () => {
      try {
        return await api.push.getStatistics();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  return {
    data: statisticsQuery.data ?? { active_tokens: 0, active_users: 0 } as PushStatisticsWithRelations,
    isLoading: statisticsQuery.isLoading,
    isError: statisticsQuery.isError,
    error: statisticsQuery.error,
  };
}

export function useNotificationHistory() {
  const { showError } = useToastContext();

  const notificationsQuery = useQuery({
    queryKey: ['push_notifications'],
    queryFn: async () => {
      try {
        return await api.push.getNotificationHistory();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  return {
    data: notificationsQuery.data ?? [] as NotificationHistory[],
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,
  };
}

export function usePushUsers() {
  const { showError } = useToastContext();

  const usersQuery = useQuery({
    queryKey: ['push_users'],
    queryFn: async () => {
      try {
        return await api.push.getUsers();
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  return {
    data: usersQuery.data ?? [] as PushUserWithRelations[],
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
  };
}

export function useSendNotification() {
  const { showSuccess, showError } = useToastContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notification: NotificationFormData) => api.push.sendNotification(notification),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['push_notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['push_statistics'] });
      showSuccess('Notification sent successfully');
    },
    onError: error => {
      showError(error);
    },
  });
}
