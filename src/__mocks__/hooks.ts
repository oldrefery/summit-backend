// src/__mocks__/hooks.ts
import { vi } from 'vitest';
import type { Person, Event, Location, Section, Resource, Announcement, Version } from '@/types';
import { TEST_DATA } from './test-constants';
import type { EventWithRelations } from '@/hooks/use-events';
import type { PersonWithRelations } from '@/hooks/use-people';
import type { LocationWithRelations } from '@/hooks/use-locations';
import type { MarkdownPageWithRelations } from '@/hooks/use-markdown';
import type { ResourceWithRelations } from '@/hooks/use-resources';
import type { ChangesWithRelations } from '@/hooks/use-changes';
import type { AnnouncementWithRelations } from '@/hooks/use-announcements';
import type { VersionWithRelations } from '@/hooks/use-versions';
import type { PushStatisticsWithRelations, PushNotificationWithRelations, PushUserWithRelations } from '@/hooks/use-push';
import type { PushStatistics, PushNotification, PushUser } from '@/hooks/use-push';

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
  vi.mock('@/hooks/use-people', () => ({
    usePeople: () => ({
      data: [createTestData.person()] as PersonWithRelations[],
      isLoading: false,
      createPerson: defaultMutationResult,
      updatePerson: defaultMutationResult,
      deletePerson: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-events', () => ({
    useEvents: () => ({
      data: [createTestData.event()] as EventWithRelations[],
      isLoading: false,
      createEvent: defaultMutationResult,
      updateEvent: defaultMutationResult,
      deleteEvent: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-locations', () => ({
    useLocations: () => ({
      data: [createTestData.location()] as LocationWithRelations[],
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
      }] as MarkdownPageWithRelations[],
      isLoading: false,
      createMarkdownPage: defaultMutationResult,
      updateMarkdownPage: defaultMutationResult,
      deleteMarkdownPage: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-resources', () => ({
    useResources: () => ({
      data: [createTestData.resource()] as ResourceWithRelations[],
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
      data: {
        events: 0,
        people: 0,
        locations: 0,
        sections: 0,
        resources: 0,
        announcements: 0,
        social_posts: 0,
        markdown_pages: 0,
      } as ChangesWithRelations,
      isLoading: false,
      publishVersion: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-push', () => ({
    usePushStatistics: () => ({
      data: {
        active_tokens: TEST_DATA.PUSH_STATISTICS.ACTIVE_TOKENS,
        active_users: TEST_DATA.PUSH_STATISTICS.ACTIVE_USERS,
        total_users: TEST_DATA.PUSH_STATISTICS.TOTAL_USERS,
      } as PushStatisticsWithRelations,
      isLoading: false,
      isError: false,
      error: null,
    }),
    useNotificationHistory: () => ({
      data: [createTestData.pushNotification()] as PushNotificationWithRelations[],
      isLoading: false,
      isError: false,
      error: null,
    }),
    usePushUsers: () => ({
      data: [createTestData.pushUser()] as PushUserWithRelations[],
      isLoading: false,
      isError: false,
      error: null,
    }),
    useSendNotification: () => defaultMutationResult,
  }));

  vi.mock('@/hooks/use-announcements', () => ({
    useAnnouncements: () => ({
      data: [createTestData.announcement()] as AnnouncementWithRelations[],
      isLoading: false,
      createAnnouncement: defaultMutationResult,
      updateAnnouncement: defaultMutationResult,
      deleteAnnouncement: defaultMutationResult,
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
      data: [createTestData.version()] as VersionWithRelations[],
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
    event_people: [],
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

  resource: (override: Partial<Resource> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    name: 'Test Resource',
    is_route: false,
    created_at: TEST_DATA.DEFAULTS.DATETIME,
    ...override,
  }),

  announcement: (override: Partial<Announcement> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    title: 'Test Announcement',
    content: 'Test Content',
    created_at: TEST_DATA.DEFAULTS.DATETIME,
    ...override,
  }),

  version: (override: Partial<Version> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    version: '1.0.0',
    created_at: TEST_DATA.DEFAULTS.DATETIME,
    published_at: TEST_DATA.DEFAULTS.DATETIME,
    changes: {
      pages: 2,
      events: 1
    },
    file_url: 'https://example.com/v1.0.0.zip',
    ...override,
  }),

  pushStatistics: (override: Partial<PushStatistics> = {}) => ({
    active_tokens: 100,
    active_users: 50,
    ...override,
  }),

  pushNotification: (override: Partial<PushNotification> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    title: 'Test Notification',
    body: 'Test Body',
    sent_at: TEST_DATA.DEFAULTS.DATETIME,
    status: 'delivered' as const,
    target_users: ['user1', 'user2'],
    ...override,
  }),

  pushUser: (override: Partial<PushUser> = {}) => ({
    id: TEST_DATA.DEFAULTS.ID,
    token: 'test-token',
    platform: 'ios' as const,
    created_at: TEST_DATA.DEFAULTS.DATETIME,
    last_active: TEST_DATA.DEFAULTS.DATETIME,
    device_info: {
      deviceName: 'iPhone 12',
      osName: 'iOS 15.0'
    },
    ...override,
  }),
};

// Mock function for toast notifications
export const mockToast = vi.fn();
