// src/lib/toast-handler.ts
'use client';

import { toast } from '@/components/ui/use-toast';
import { FORM } from '@/app/constants';

export function showToastError(message: string) {
  toast({
    id: String(new Date().getTime()),
    title: 'Error',
    description: message,
    variant: 'destructive',
    duration: FORM.TOAST.ERROR_DURATION,
  });
}

export function showToastSuccess(message: string) {
  toast({
    id: String(new Date().getTime()),
    title: 'Success',
    description: message,
    variant: 'success',
    duration: FORM.TOAST.SUCCESS_DURATION,
  });
}
