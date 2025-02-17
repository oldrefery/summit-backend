// src/__mocks__/test-submit-setup.tsx
import { vi } from 'vitest';
import { toastContext } from './providers-mock';

export const mockMutation = {
  mutateAsync: vi.fn().mockImplementation(async () => {
    toastContext.showSuccess('Event created successfully');
    return { id: 1 };
  }),
  isPending: false,
};

export const mockFormEvents = {
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
};
