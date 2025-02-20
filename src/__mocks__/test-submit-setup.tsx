// src/__mocks__/test-submit-setup.tsx
import { vi } from 'vitest';
import { toastContext } from './providers-mock';
import type { UseMutationResult, UseMutateFunction, UseMutateAsyncFunction } from '@tanstack/react-query';

export interface Section {
  id?: number;
  name: string;
  date: string;
}

export interface UpdateSectionData {
  id: number;
  data: Omit<Section, 'id'>;
}

export const createMockMutation = <TData = Section, TVariables = Section>(
  customHandler?: (data: TVariables) => Promise<TData>
) => {
  type MutationStatus = 'idle' | 'pending' | 'success' | 'error';
  let currentStatus: MutationStatus = 'idle';
  let currentError: Error | null = null;
  let currentData: TData | undefined = undefined;

  const mutateAsyncFn = vi.fn().mockImplementation(async (data: TVariables) => {
    try {
      currentStatus = 'pending';
      if (customHandler) {
        currentData = await customHandler(data);
      } else {
        toastContext.showSuccess('Operation completed successfully');
        currentData = { id: 1, ...data } as TData;
      }
      currentStatus = 'success';
      return currentData;
    } catch (error) {
      currentStatus = 'error';
      currentError = error as Error;
      throw error;
    }
  });

  const mutate = vi.fn().mockImplementation(async (data: TVariables) => {
    try {
      return await mutateAsyncFn(data);
    } catch (error) {
      console.error(error);
    }
  });

  const getMutationState = () => ({
    mutateAsync: mutateAsyncFn as unknown as UseMutateAsyncFunction<TData, Error, TVariables, unknown>,
    mutate: mutate as unknown as UseMutateFunction<TData, Error, TVariables, unknown>,
    data: currentData,
    error: currentError,
    failureCount: currentError ? 1 : 0,
    failureReason: currentError,
    isError: currentStatus === 'error',
    isPaused: false,
    isSuccess: currentStatus === 'success',
    isIdle: currentStatus === 'idle',
    isPending: currentStatus === 'pending',
    reset: vi.fn(() => {
      currentStatus = 'idle';
      currentError = null;
      currentData = undefined;
    }),
    status: currentStatus,
    submittedAt: Date.now(),
    variables: undefined as TVariables | undefined,
    context: undefined
  });

  return getMutationState() as UseMutationResult<TData, Error, TVariables, unknown>;
};

export const mockMutation = createMockMutation();

export const mockFormEvents = {
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: null
};
