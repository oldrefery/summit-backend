// src/hooks/use-push.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { NotificationFormData } from '@/types/push';

export interface PushStatistics {
  active_tokens: number;
  active_users: number;
  total_users: number;
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
  id: string;
  device_id: string;
  device_info: {
    deviceName: string;
    osName: string;
    osVersion: string;
    deviceModel: string;
    appVersion: string;
    buildNumber: string;
  };
  push_token?: string;
  settings: {
    social_feed: boolean;
    announcements: boolean;
  };
  last_active_at: string;
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
        const data = await api.push.getStatistics();
        return data || { active_tokens: 0, active_users: 0, total_users: 0 };
      } catch (error) {
        showError(error);
        throw error;
      }
    },
  });

  return {
    data: statisticsQuery.data ?? { active_tokens: 0, active_users: 0, total_users: 0 } as PushStatisticsWithRelations,
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
        const data = await api.push.getNotificationHistory();
        return data || [];
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
        const data = await api.push.getUsers();
        return data || [];
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
    mutationFn: async (notification: NotificationFormData) => {
      try {
        // Use the API route instead of direct function call
        const response = await fetch('/api/push-notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notification),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send notification');
        }

        return await response.json();
      } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
      }
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['push_notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['push_statistics'] });
      showSuccess(`Notification sent successfully to ${result.successful} devices. Failed: ${result.failed}`);
    },
    onError: error => {
      showError(error);
    },
  });
}
