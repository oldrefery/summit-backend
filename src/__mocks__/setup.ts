// src/__mocks__/setup.ts
import '@testing-library/jest-dom';
import { expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { queryClient } from './test-wrapper';
import { TEST_DATA } from './test-constants';

expect.extend(matchers);

// Set up Supabase environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.SUPABASE_ANON_EMAIL = TEST_DATA.USER.EMAIL;
process.env.SUPABASE_ANON_PASSWORD = TEST_DATA.USER.PASSWORD;

// Mock Next.js navigation hooks
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

// Import Supabase mocks after environment variables are set
import './supabase';

afterEach(() => {
  cleanup(); // Clean up DOM after each test
  queryClient.clear(); // Clear React Query cache
  vi.clearAllMocks();
});
