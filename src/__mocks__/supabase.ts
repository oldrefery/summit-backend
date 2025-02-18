// src/__mocks__/supabase.ts
import { vi } from 'vitest';

// Mock implementation of Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    autoRefreshToken: true,
    persistSession: true,
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi
        .fn()
        .mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
  }),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

export const supabase = mockSupabaseClient;

// Mock implementation of API endpoints
export const api = {
  events: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  locations: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  people: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  sections: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  resources: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  markdown: {
    getAll: vi.fn().mockResolvedValue([]),
    getBySlug: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  changes: {
    getAll: vi.fn().mockResolvedValue({}),
    publish: vi.fn().mockResolvedValue({}),
  },
  push: {
    getUsers: vi.fn().mockResolvedValue([]),
    getTokens: vi.fn().mockResolvedValue([]),
    getNotificationHistory: vi.fn().mockResolvedValue([]),
    sendNotification: vi.fn().mockResolvedValue({}),
    getStatistics: vi.fn().mockResolvedValue({
      active_tokens: 0,
      active_users: 0,
    }),
  },
  announcements: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  versions: {
    getAll: vi.fn().mockResolvedValue([]),
    rollback: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
};

// Mock implementation of storage service
export const storage = {
  uploadAvatar: vi.fn().mockResolvedValue('https://test.com/avatar.jpg'),
  removeAvatar: vi.fn().mockResolvedValue(undefined),
};

// Mock implementation of authentication middleware
export const ensureAuthenticated = vi.fn().mockResolvedValue(undefined);

// Mock the @supabase/supabase-js package
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabaseClient),
}));

// Mock the entire Supabase module to ensure consistent behavior in tests
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
  api,
  storage,
  ensureAuthenticated,
}));
