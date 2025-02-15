// src/lib/toast-handler.ts

import { toast } from '@/components/ui/use-toast';

export function showToastError(message: string) {
  toast({
    id: String(new Date().getTime()), // Генерируем уникальный id
    title: 'Error',
    description: message,
    variant: 'destructive',
    duration: 5000,
  });
}

export function showToastSuccess(message: string) {
  toast({
    id: String(new Date().getTime()), // Уникальный id для каждого тоста
    title: 'Success',
    description: message,
    variant: 'success',
    duration: 3000,
  });
}
