// src/hooks/use-push.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import type { NotificationFormData } from '@/types/push';

export function usePushUsers() {
  return useQuery({
    queryKey: ['push_users'],
    queryFn: () => api.push.getUsers(),
  });
}

export function usePushTokens() {
  return useQuery({
    queryKey: ['push_tokens'],
    queryFn: () => api.push.getTokens(),
  });
}

export function useNotificationHistory() {
  return useQuery({
    queryKey: ['notification_history'],
    queryFn: () => api.push.getNotificationHistory(),
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToastContext();

  return useMutation({
    mutationFn: (notification: NotificationFormData) =>
      api.push.sendNotification(notification),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['notification_history'],
      });
      showSuccess('Notification sent successfully');
    },
    onError: error => {
      showError(error);
    },
  });
}

export function usePushStatistics() {
  return useQuery({
    queryKey: ['push_statistics'],
    queryFn: () => api.push.getStatistics(),
  });
}
