// src/__mocks__/providers-mock.tsx
import React, { createContext } from 'react';
import { vi } from 'vitest';

// Определяем тип для контекста
interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string | Error) => void;
}

// Создаем моки с правильными типами
const showSuccessMock = vi.fn((_: string) => void 0);
const showErrorMock = vi.fn((_: string | Error) => void 0);

export const toastContext = {
  showSuccess: showSuccessMock,
  showError: showErrorMock,
} as ToastContextType;

// Создаем контекст
export const ToastContext = createContext<ToastContextType>(toastContext);

// Создаем компонент-провайдер
export const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <ToastContext.Provider value={toastContext}>{children}</ToastContext.Provider>
);

// Мокируем модуль toast-provider
vi.mock('@/components/providers/toast-provider', () => ({
  ToastProvider,
  useToastContext: () => toastContext,
}));
