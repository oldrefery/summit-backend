import { describe, test, expect } from 'vitest';
import { BaseIntegrationTest } from '../base-test';
import type { Event, Section } from '@/types';
import { delay } from '../../../utils/test-utils';

class EventsTest extends BaseIntegrationTest {
    static async createEvent(title: string, sectionId: number) {
        const testDate = '2024-03-20';
        return this.initializeTestData<Event>('events', {
            section_id: sectionId,
            title,
            date: testDate,
            start_time: `${testDate}T10:00:00Z`,
            end_time: `${testDate}T11:00:00Z`,
            description: 'Test Description',
            duration: '1h',
            location_id: null
        });
    }

    static async createSection(name: string) {
        return this.initializeTestData<Section>('sections', {
            name,
            date: '2024-03-20'
        });
    }
}

describe('Events Table RLS Policies', () => {
    let createdEventId: number;
    let testSectionId: number;
    const uniqueId = Date.now();

    describe('Anonymous Access', () => {
        test('cannot create records', async () => {
            // First create a section as authenticated user
            const section = await EventsTest.createSection(`Test Section ${uniqueId}`);
            testSectionId = section.id;

            await delay(1000);

            const testEvent = {
                section_id: testSectionId,
                title: `Test Event ${uniqueId}`,
                date: '2024-03-20',
                start_time: '2024-03-20T10:00:00Z',
                end_time: '2024-03-20T11:00:00Z',
                description: 'Test Description',
                duration: '1h',
                location_id: null
            };

            const { data, error } = await EventsTest.getAnonymousClient()
                .from('events')
                .insert([testEvent])
                .select()
                .single();

            expect(error).not.toBeNull();
            expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
            expect(data).toBeNull();

            await delay(1000);
        });

        test('cannot read records', async () => {
            const { data, error } = await EventsTest.getAnonymousClient()
                .from('events')
                .select('*');

            expect(data).toEqual([]);
            expect(error).toBeNull();

            await delay(1000);
        });
    });

    describe('Authenticated Access', () => {
        test('can create and read records', async () => {
            const event = await EventsTest.createEvent(`Test Event Create ${uniqueId}`, testSectionId);
            createdEventId = event.id;

            expect(event).not.toBeNull();
            expect(event.title).toContain('Test Event Create');

            // Read all events
            const { data: readData, error: readError } = await EventsTest.getAuthenticatedClient()
                .from('events')
                .select('*');

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            expect(Array.isArray(readData)).toBe(true);
            expect(readData?.length).toBeGreaterThan(0);
            expect(readData?.find(e => e.id === createdEventId)).toBeTruthy();

            await delay(1000);
        });

        test('can update records', async () => {
            const updates = {
                title: `Updated Event ${uniqueId}`,
                description: 'Updated Description'
            };

            const { data, error } = await EventsTest.getAuthenticatedClient()
                .from('events')
                .update(updates)
                .eq('id', createdEventId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.title).toBe(updates.title);
            expect(data?.description).toBe(updates.description);

            await delay(1000);
        });

        test('can delete records', async () => {
            await EventsTest.cleanupTestData('events', createdEventId);

            // Verify deletion
            const { data, error: readError } = await EventsTest.getAuthenticatedClient()
                .from('events')
                .select('*')
                .eq('id', createdEventId)
                .single();

            expect(data).toBeNull();
            expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

            createdEventId = 0;

            await delay(1000);
        });

        test('has access to all fields', async () => {
            const event = await EventsTest.createEvent(`Test Event Fields ${uniqueId}`, testSectionId);
            createdEventId = event.id;

            // Try to read all fields
            const { data: readData, error: readError } = await EventsTest.getAuthenticatedClient()
                .from('events')
                .select('id, section_id, title, date, start_time, end_time, description, duration, location_id')
                .eq('id', createdEventId)
                .single();

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            // All fields should be visible
            expect(readData?.title).toContain('Test Event Fields');
            expect(readData?.section_id).toBe(testSectionId);
            expect(readData?.date).toBe('2024-03-20');
            expect(new Date(readData?.start_time).toISOString()).toBe('2024-03-20T10:00:00.000Z');
            expect(new Date(readData?.end_time).toISOString()).toBe('2024-03-20T11:00:00.000Z');

            await delay(1000);
        });
    });

    afterAll(async () => {
        // Cleanup test section
        if (testSectionId) {
            await EventsTest.cleanupTestData('sections', testSectionId);
        }
    });
}); 