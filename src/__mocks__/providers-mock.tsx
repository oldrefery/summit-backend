// src/__mocks__/providers-mock.tsx
import React, { createContext } from 'react';
import { vi } from 'vitest';

// Type definition for the toast context
interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string | Error) => void;
}

// Initialize mock functions with proper types
const showSuccessMock = vi.fn(() => void 0);
const showErrorMock = vi.fn(() => void 0);

export const toastContext = {
  showSuccess: showSuccessMock,
  showError: showErrorMock,
} as ToastContextType;

// Create the context with default mock values
export const ToastContext = createContext<ToastContextType>(toastContext);

// Provider component for testing
export const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <ToastContext.Provider value={toastContext}>{children}</ToastContext.Provider>
);

// Mock the toast-provider module for testing
vi.mock('@/components/providers/toast-provider', () => ({
  ToastProvider,
  useToastContext: () => toastContext,
}));
