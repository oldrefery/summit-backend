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
      data: [],
      isLoading: false,
      createEvent: defaultMutationResult,
      updateEvent: defaultMutationResult,
      deleteEvent: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-locations', () => ({
    useLocations: () => ({
      data: [],
      isLoading: false,
      createLocation: defaultMutationResult,
      updateLocation: defaultMutationResult,
      deleteLocation: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-markdown', () => ({
    useMarkdownPages: () => ({
      data: [],
      isLoading: false,
      createMarkdownPage: defaultMutationResult,
      updateMarkdownPage: defaultMutationResult,
      deleteMarkdownPage: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-resources', () => ({
    useResources: () => ({
      data: [],
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
      data: {},
      isLoading: false,
      publishVersion: defaultMutationResult,
    }),
  }));

  vi.mock('@/hooks/use-push', () => ({
    usePushStatistics: () => ({
      data: { active_tokens: 0, active_users: 0 },
      isLoading: false,
    }),
    useNotificationHistory: () => ({
      data: [],
      isLoading: false,
    }),
    usePushUsers: () => ({
      data: [],
      isLoading: false,
    }),
    useSendNotification: () => defaultMutationResult,
  }));

  vi.mock('@/hooks/use-announcements', () => ({
    useAnnouncements: () => ({ data: [], isLoading: false }),
  }));

  vi.mock('@/hooks/use-sort-filter', () => ({
    useSortFilter: () => ({
      searchQuery: '',
      setSearchQuery: vi.fn(),
      sortKey: 'name',
      sortOrder: 'asc',
      handleSort: vi.fn(),
      filteredAndSorted: [],
    }),
  }));

  vi.mock('@/hooks/use-versions', () => ({
    useVersions: () => ({ data: [], isLoading: false }),
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
