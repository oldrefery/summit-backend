import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useEvents } from '../use-events';
import { api } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/toast-provider';
import { Providers } from '@/__mocks__/test-wrapper';
import type { Event, Person, EventPerson } from '@/types';

// Mock the API and toast context
vi.mock('@/lib/supabase', () => ({
    api: {
        events: {
            getAll: vi.fn(),
            getById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

describe('useEvents', () => {
    const mockPerson: Person = {
        id: 1,
        name: 'John Doe',
        role: 'speaker',
        created_at: new Date().toISOString(),
    };

    const mockEventPerson: EventPerson = {
        id: 1,
        event_id: 1,
        person_id: 1,
        role: 'speaker',
        created_at: new Date().toISOString(),
        person: mockPerson,
    };

    const mockEvents: Event[] = [
        {
            id: 1,
            section_id: 1,
            title: 'Test Event 1',
            date: '2024-03-01',
            start_time: '10:00',
            end_time: '11:00',
            created_at: new Date().toISOString(),
            location_id: null,
            event_people: [mockEventPerson],
        },
        {
            id: 2,
            section_id: 1,
            title: 'Test Event 2',
            date: '2024-03-02',
            start_time: '14:00',
            end_time: '15:00',
            created_at: new Date().toISOString(),
            location_id: null,
            event_people: [],
        },
    ];

    const mockToast = {
        showSuccess: vi.fn(),
        showError: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useToastContext as jest.Mock).mockReturnValue(mockToast);
        (api.events.getAll as jest.Mock).mockResolvedValue(mockEvents);
        (api.events.getById as jest.Mock).mockImplementation((id: number) =>
            Promise.resolve(mockEvents.find(event => event.id === id)));
        (api.events.create as jest.Mock).mockImplementation((data) =>
            Promise.resolve({ id: 3, ...data, created_at: new Date().toISOString(), event_people: [] }));
        (api.events.update as jest.Mock).mockImplementation((id, data) =>
            Promise.resolve({ ...mockEvents[0], ...data }));
        (api.events.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('fetches all events', async () => {
        const { result } = renderHook(() => useEvents(), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockEvents);
        expect(api.events.getAll).toHaveBeenCalledTimes(1);
    });

    it('fetches single event by id', async () => {
        const { result } = renderHook(() => useEvents(1), {
            wrapper: Providers,
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockEvents[0]);
        expect(api.events.getById).toHaveBeenCalledWith(1);
    });

    it('handles error when fetching events', async () => {
        const error = new Error('Failed to fetch');
        (api.events.getAll as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useEvents(), {
            wrapper: Providers,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('creates an event successfully', async () => {
        const newEvent = {
            section_id: 1,
            title: 'New Event',
            date: '2024-03-03',
            start_time: '12:00',
            end_time: '13:00',
            speaker_ids: [1],
        };

        const { result } = renderHook(() => useEvents(), {
            wrapper: Providers,
        });

        await result.current.createEvent.mutateAsync(newEvent);

        expect(api.events.create).toHaveBeenCalledWith(newEvent);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Event created successfully');
    });

    it('updates an event successfully', async () => {
        const updateData = {
            title: 'Updated Event',
            date: '2024-03-04',
        };

        const { result } = renderHook(() => useEvents(), {
            wrapper: Providers,
        });

        await result.current.updateEvent.mutateAsync({ id: 1, updates: updateData });

        expect(api.events.update).toHaveBeenCalledWith(1, updateData);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Event updated successfully');
    });

    it('deletes an event successfully', async () => {
        const { result } = renderHook(() => useEvents(), {
            wrapper: Providers,
        });

        await result.current.deleteEvent.mutateAsync(1);

        expect(api.events.delete).toHaveBeenCalledWith(1);
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Event deleted successfully');
    });

    it('handles error when creating event', async () => {
        const error = new Error('Failed to create');
        (api.events.create as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useEvents(), {
            wrapper: Providers,
        });

        const newEvent = {
            section_id: 1,
            title: 'New Event',
            date: '2024-03-03',
            start_time: '12:00',
            end_time: '13:00',
            speaker_ids: [1],
        };

        await result.current.createEvent.mutateAsync(newEvent).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when updating event', async () => {
        const error = new Error('Failed to update');
        (api.events.update as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useEvents(), {
            wrapper: Providers,
        });

        await result.current.updateEvent.mutateAsync({
            id: 1,
            updates: { title: 'Updated Event' },
        }).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });

    it('handles error when deleting event', async () => {
        const error = new Error('Failed to delete');
        (api.events.delete as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useEvents(), {
            wrapper: Providers,
        });

        await result.current.deleteEvent.mutateAsync(1).catch(() => { });

        expect(mockToast.showError).toHaveBeenCalledWith(error);
    });
}); 