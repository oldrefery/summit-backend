// src/__mocks__/hooks.ts
import { vi } from 'vitest';
import type { Person, Event, Location, Section } from '@/types';
import { TEST_DATA, TestDateUtils } from './test-constants';

// Utility function for creating test data
const defaultMutationResult = {
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({ id: TEST_DATA.DEFAULTS.ID }),
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
      data: [createTestData.event()],
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
        id: TEST_DATA.DEFAULTS.ID,
        title: 'Test Page',
        content: 'Test Content',
        created_at: TEST_DATA.DEFAULTS.DATETIME,
        updated_at: TEST_DATA.DEFAULTS.DATETIME,
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
      data: [{
        id: TEST_DATA.DEFAULTS.ID,
        name: 'Test Resource',
        url: 'https://test.com',
        created_at: TEST_DATA.DEFAULTS.DATETIME
      }],
      isLoading: false,
      createResource: defaultMutationResult,
      updateResource: defaultMutationResult,
      deleteResource: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-sections', () => ({
    useSections: () => ({
      data: [createTestData.section()],
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
      data: TEST_DATA.PUSH_STATISTICS,
      isLoading: false,
    }),
    useNotificationHistory: () => ({
      data: [{
        id: TEST_DATA.DEFAULTS.ID,
        title: 'Test Notification',
        body: 'Test Body',
        sent_at: TEST_DATA.DEFAULTS.DATETIME,
        status: 'delivered',
        target_users: ['user1', 'user2']
      }],
      isLoading: false,
    }),
    usePushUsers: () => ({
      data: [{
        id: TEST_DATA.DEFAULTS.ID,
        token: 'test-token',
        platform: 'ios',
        created_at: TEST_DATA.DEFAULTS.DATETIME,
        last_active: TEST_DATA.DEFAULTS.DATETIME,
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
        id: TEST_DATA.DEFAULTS.ID,
        title: 'Test Announcement',
        content: 'Test Content',
        created_at: TEST_DATA.DEFAULTS.DATETIME
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
        id: TEST_DATA.DEFAULTS.ID,
        name: 'Test Item',
        created_at: TEST_DATA.DEFAULTS.DATETIME
      }],
    }),
  }));

  vi.mock('@/hooks/use-versions', () => ({
    useVersions: () => ({
      data: [{
        id: TEST_DATA.DEFAULTS.ID,
        version: '1.0.0',
        created_at: TEST_DATA.DEFAULTS.DATETIME,
        published_at: TEST_DATA.DEFAULTS.DATETIME,
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

// Test data factory functions
export const createTestData = {
  person: (override: Partial<Person> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    name: 'Test Person',
    role: 'speaker' as const,
    created_at: TEST_DATA.DEFAULTS.DATETIME,
    title: 'Test Title',
    company: 'Test Company',
    ...override,
  }),

  event: (override: Partial<Event> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    title: 'Test Event',
    date: TEST_DATA.DEFAULTS.DATE,
    start_time: TEST_DATA.DEFAULTS.TIME.START,
    end_time: TEST_DATA.DEFAULTS.TIME.END,
    section_id: TEST_DATA.DEFAULTS.ID,
    created_at: TEST_DATA.DEFAULTS.DATETIME,
    description: 'Test Description',
    ...override,
  }),

  location: (override: Partial<Location> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    name: 'Test Location',
    created_at: TEST_DATA.DEFAULTS.DATETIME,
    link_map: 'https://test.map',
    ...override,
  }),

  section: (override: Partial<Section> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    name: 'Test Section',
    date: TEST_DATA.DEFAULTS.DATE,
    created_at: TEST_DATA.DEFAULTS.DATETIME,
    ...override,
  }),
};

// Mock function for toast notifications
export const mockToast = vi.fn();
