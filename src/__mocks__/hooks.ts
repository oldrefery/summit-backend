// src/__mocks__/hooks.ts
import { vi } from 'vitest';
import type { Person, Event, Location, Section } from '@/types';

// Используем вспомогательную функцию для создания тестовых данных
const defaultMutationResult = {
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({ id: 1 }),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  reset: vi.fn(),
};

export const mockHooks = () => {
  vi.mock('@/hooks/use-query', () => ({
    usePeople: () => ({
      data: [createTestData.person()],
      isLoading: false,
      createPerson: defaultMutationResult,
      updatePerson: defaultMutationResult,
      deletePerson: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-events', () => ({
    useEvents: () => ({
      data: [{
        id: 1,
        title: 'Test Event',
        date: '2024-02-16',
        start_time: '10:00:00',
        end_time: '11:00:00',
        section_id: 1,
        created_at: '2024-02-16T00:00:00Z',
        description: 'Test Description',
        location: { id: 1, name: 'Test Location' },
        event_people: [],
        section: { id: 1, name: 'Test Section' }
      }],
      isLoading: false,
      createEvent: defaultMutationResult,
      updateEvent: defaultMutationResult,
      deleteEvent: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-locations', () => ({
    useLocations: () => ({
      data: [createTestData.location()],
      isLoading: false,
      createLocation: defaultMutationResult,
      updateLocation: defaultMutationResult,
      deleteLocation: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-markdown', () => ({
    useMarkdownPages: () => ({
      data: [{
        id: 1,
        title: 'Test Page',
        content: 'Test Content',
        created_at: '2024-02-16T00:00:00Z',
        updated_at: '2024-02-16T00:00:00Z',
        slug: 'test-page',
        published: true
      }],
      isLoading: false,
      createMarkdownPage: defaultMutationResult,
      updateMarkdownPage: defaultMutationResult,
      deleteMarkdownPage: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-resources', () => ({
    useResources: () => ({
      data: [{ id: 1, name: 'Test Resource', url: 'https://test.com', created_at: '2024-02-16T00:00:00Z' }],
      isLoading: false,
      createResource: defaultMutationResult,
      updateResource: defaultMutationResult,
      deleteResource: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-sections', () => ({
    useSections: () => ({
      data: [
        {
          id: 1,
          name: 'Test Section',
          date: '2024-02-16',
          created_at: '2024-02-16T00:00:00Z',
        },
      ],
      isLoading: false,
      createSection: defaultMutationResult,
      updateSection: defaultMutationResult,
      deleteSection: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-changes', () => ({
    useChanges: () => ({
      data: { changes: [], lastPublishedVersion: '1.0.0' },
      isLoading: false,
      publishVersion: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-push', () => ({
    usePushStatistics: () => ({
      data: {
        active_tokens: 100,
        active_users: 50,
        total_notifications: 1000,
        total_sent: 500,
        total_delivered: 450,
        total_opened: 200
      },
      isLoading: false,
    }),
    useNotificationHistory: () => ({
      data: [{
        id: 1,
        title: 'Test Notification',
        body: 'Test Body',
        sent_at: '2024-02-16T00:00:00Z',
        status: 'delivered',
        target_users: ['user1', 'user2']
      }],
      isLoading: false,
    }),
    usePushUsers: () => ({
      data: [{
        id: 1,
        token: 'test-token',
        platform: 'ios',
        created_at: '2024-02-16T00:00:00Z',
        last_active: '2024-02-16T00:00:00Z',
        device_info: {
          deviceName: 'iPhone 12',
          osName: 'iOS 15.0'
        }
      }],
      isLoading: false,
    }),
    useSendNotification: () => defaultMutationResult,
  }));

  vi.mock('@/hooks/use-announcements', () => ({
    useAnnouncements: () => ({
      data: [{
        id: 1,
        title: 'Test Announcement',
        content: 'Test Content',
        created_at: '2024-02-16T00:00:00Z'
      }],
      isLoading: false
    }),
  }));

  vi.mock('@/hooks/use-sort-filter', () => ({
    useSortFilter: () => ({
      searchQuery: '',
      setSearchQuery: vi.fn(),
      sortKey: 'name',
      sortOrder: 'asc',
      handleSort: vi.fn(),
      filteredAndSorted: [{
        id: 1,
        name: 'Test Item',
        created_at: '2024-02-16T00:00:00Z'
      }],
    }),
  }));

  vi.mock('@/hooks/use-versions', () => ({
    useVersions: () => ({
      data: [{
        id: 1,
        version: '1.0.0',
        created_at: '2024-02-16T00:00:00Z',
        published_at: '2024-02-16T00:00:00Z',
        changes: {
          pages: 2,
          events: 1
        },
        file_url: 'https://example.com/v1.0.0.zip'
      }],
      isLoading: false,
      rollbackVersion: defaultMutationResult
    }),
  }));
};

// Helper для создания тестовых данных
export const createTestData = {
  person: (override: Partial<Person> = {}) => ({
    id: 1,
    name: 'Test Person',
    role: 'speaker' as const,
    created_at: '2024-02-16T00:00:00Z',
    title: 'Test Title',
    company: 'Test Company',
    ...override,
  }),

  event: (override: Partial<Event> = {}) => ({
    id: 1,
    title: 'Test Event',
    date: '2024-02-16',
    start_time: '10:00',
    end_time: '11:00',
    section_id: 1,
    created_at: '2024-02-16T00:00:00Z',
    description: 'Test Description',
    ...override,
  }),

  location: (override: Partial<Location> = {}) => ({
    id: 1,
    name: 'Test Location',
    created_at: '2024-02-16T00:00:00Z',
    link_map: 'https://test.map',
    ...override,
  }),

  section: (override: Partial<Section> = {}) => ({
    id: 1,
    name: 'Test Section',
    date: '2024-02-16',
    created_at: '2024-02-16T00:00:00Z',
    ...override,
  }),
};

// Helper для мока toast уведомлений
export const mockToast = vi.fn();
