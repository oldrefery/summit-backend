// src/lib/expo-push.ts
import { NotificationFormData } from '@/types/push';
import { useQuery } from '@tanstack/react-query';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushResponse {
  data: {
    status: 'ok' | 'error';
    id: string;
    message?: string;
  }[];
}

export async function sendPushNotifications(
  tokens: string[],
  notification: NotificationFormData
): Promise<{ successful: string[]; failed: string[] }> {
  const messages: ExpoPushMessage[] = tokens.map(token => ({
    to: token,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    sound: 'default',
    priority: 'high',
  }));

  const chunks = chunkArray(messages, 100); // Expo принимает максимум 100 уведомлений за раз
  const results = { successful: [] as string[], failed: [] as string[] };

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const result = (await response.json()) as ExpoPushResponse;

      result.data.forEach((ticket, index) => {
        const token = chunk[index].to;
        if (ticket.status === 'ok') {
          results.successful.push(token);
        } else {
          results.failed.push(token);
        }
      });
    } catch (error) {
      chunk.forEach(message => results.failed.push(message.to));
      console.error('Failed to send push notifications:', error);
    }
  }

  return results;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  let index = 0;

  while (index < array.length) {
    chunked.push(array.slice(index, index + size));
    index += size;
  }

  return chunked;
}
