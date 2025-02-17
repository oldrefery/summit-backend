// src/__mocks__/setup.ts
import '@testing-library/jest-dom';
import { expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { queryClient } from './test-wrapper';

expect.extend(matchers);

// Устанавливаем переменные окружения для Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.SUPABASE_ANON_EMAIL = 'test@example.com';
process.env.SUPABASE_ANON_PASSWORD = 'test-password';

// Мок для next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
    };
  },
  useParams() {
    return {};
  },
  usePathname() {
    return '';
  },
}));

// Этот импорт должен идти после установки переменных окружения
import './supabase';

afterEach(() => {
  cleanup(); // Очистка после каждого теста
  queryClient.clear(); // Очистка кэша react-query вместо clearQueryCache
  vi.clearAllMocks();
});
