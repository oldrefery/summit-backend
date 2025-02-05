// src/components/providers/toast-provider.tsx
'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';

type ToastContextType = {
  showSuccess: (message: string) => void;
  showError: (error: unknown) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const showSuccess = useCallback(
    (message: string) => {
      toast({
        title: 'Success',
        description: message,
        variant: 'success',
        duration: 3000,
      });
    },
    [toast]
  );

  const showError = useCallback(
    (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    },
    [toast]
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
