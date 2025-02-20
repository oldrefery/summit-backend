// src/components/providers/toast-provider.tsx
'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { isToastActive, useToast } from '@/components/ui/use-toast';

export type ToastContextType = {
  showSuccess: (message: string) => void;
  showError: (error: unknown) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const showToast = useCallback(
    (message: string, variant: 'success' | 'destructive') => {
      if (!isToastActive(message)) {
        toast({
          id: message,
          title: variant === 'success' ? 'Success' : 'Error',
          description: message,
          variant,
          duration: 5000,
        });
      }
    },
    [toast]
  );

  const showSuccess = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast]
  );

  const showError = useCallback(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      showToast(message, 'destructive');
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
