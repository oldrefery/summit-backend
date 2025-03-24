import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { BaseIntegrationTest } from '../base-test';
import type { Event, Section } from '@/types';
import { generateTestName, delay } from '../config/test-utils';
import { supabase } from '@/lib/supabase';

const TEST_PROJECT_ID = 'vupwomxxfqjmwtbptkfu';

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
    let testSection: Section | null = null;
    let createdEventId: number | null = null;
    const uniqueId = Date.now();

    beforeAll(async () => {
        // Verify we're using test database
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(TEST_PROJECT_ID)) {
            throw new Error('Tests must run against test database only!');
        }

        // Login to create test section
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (loginError) throw loginError;

        // Create test section
        const { data: sectionData, error: sectionError } = await supabase
            .from('sections')
            .insert([{
                name: generateTestName('Test Section'),
                date: new Date().toISOString().split('T')[0]
            }])
            .select()
            .single();

        if (sectionError) throw sectionError;
        if (!sectionData) throw new Error('Section data is null');
        testSection = sectionData;

        // Sign out for anonymous tests
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for signout to complete
    });

    describe('Anonymous Access', () => {
        test('cannot create records', async () => {
            // First create a section as authenticated user
            const section = await EventsTest.createSection(`Test Section ${uniqueId}`);
            const testSectionId = section.id;

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
        beforeEach(async () => {
            // Login first
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
                password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
            });

            if (loginError) throw loginError;

            // Create test section if not exists
            if (!testSection) {
                const { data: sectionData, error: sectionError } = await supabase
                    .from('sections')
                    .insert([{
                        name: generateTestName('Test Section'),
                        date: new Date().toISOString().split('T')[0]
                    }])
                    .select()
                    .single();

                if (sectionError) throw sectionError;
                if (!sectionData) throw new Error('Section data is null');
                testSection = sectionData;
            }

            if (!testSection) throw new Error('Test section is still null after creation attempt');

            // Verify section exists
            const { data: verifyData, error: verifyError } = await supabase
                .from('sections')
                .select('*')
                .eq('id', testSection.id)
                .single();

            if (verifyError || !verifyData) {
                // Section doesn't exist, create a new one
                const { data: newSectionData, error: newSectionError } = await supabase
                    .from('sections')
                    .insert([{
                        name: generateTestName('Test Section'),
                        date: new Date().toISOString().split('T')[0]
                    }])
                    .select()
                    .single();

                if (newSectionError) throw newSectionError;
                if (!newSectionData) throw new Error('Section data is null');
                testSection = newSectionData;
            }
        });

        test('can create and read records', async () => {
            if (!testSection) throw new Error('Test section is not initialized');

            const testEvent = {
                section_id: testSection.id,
                title: generateTestName('Test Event'),
                date: new Date().toISOString().split('T')[0],
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 3600000).toISOString(),
                description: 'Test Description',
                duration: '1h'
            };

            // Create an event
            const { data: createData, error: createError } = await supabase
                .from('events')
                .insert([testEvent])
                .select()
                .single();

            expect(createError).toBeNull();
            expect(createData).not.toBeNull();
            expect(createData?.title).toBe(testEvent.title);
            expect(createData?.section_id).toBe(testEvent.section_id);

            if (createData?.id) {
                createdEventId = createData.id;
            }

            // Read all events
            const { data: readData, error: readError } = await supabase
                .from('events')
                .select('*');

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            expect(Array.isArray(readData)).toBe(true);
            expect(readData?.length).toBeGreaterThan(0);
            expect(readData?.find(e => e.id === createdEventId)).toBeTruthy();
        });

        test('can update records', async () => {
            let localCreatedEventId = createdEventId;

            if (!localCreatedEventId) {
                // Создадим тестовое событие, если его нет
                if (!testSection) throw new Error('Test section is not initialized');

                const testEvent = {
                    section_id: testSection.id,
                    title: generateTestName('Test Event for Update'),
                    date: new Date().toISOString().split('T')[0],
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 3600000).toISOString()
                };

                // Проверяем существование секции
                const { data: checkSection } = await supabase
                    .from('sections')
                    .select('id')
                    .eq('id', testSection.id)
                    .single();

                if (!checkSection) {
                    console.log('Test section not found, recreating...');
                    // Если секция не найдена, сначала создаем новую
                    const { data: newSection } = await supabase
                        .from('sections')
                        .insert({
                            name: generateTestName('Test Section for Event Update'),
                            date: new Date().toISOString().split('T')[0]
                        })
                        .select()
                        .single();

                    if (newSection) {
                        testSection = newSection;
                        testEvent.section_id = newSection.id;
                    } else {
                        throw new Error('Failed to create test section');
                    }
                }

                await delay(500); // Даем время для сохранения секции

                // Создаем тестовое событие
                const { data: newEvent, error: createError } = await supabase
                    .from('events')
                    .insert(testEvent)
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating test event:', createError);
                    throw new Error(`Failed to create test event: ${createError.message}`);
                }

                expect(newEvent).not.toBeNull();

                localCreatedEventId = newEvent!.id;
                createdEventId = localCreatedEventId; // Сохраняем ID для других тестов

                await delay(500); // Даем время для сохранения события
            }

            // Проверяем, что событие существует
            const { data: checkEvent } = await supabase
                .from('events')
                .select()
                .eq('id', localCreatedEventId);

            expect(checkEvent).not.toBeNull();
            expect(checkEvent?.length).toBeGreaterThan(0);

            // Выводим найденное событие для отладки
            console.log(`Found event to update:`, checkEvent?.[0]?.id, checkEvent?.[0]?.title);

            const updates = {
                title: generateTestName('Updated Event Title')
            };

            // Используем тот же подход с повторными попытками
            const maxRetries = 3;
            let attempt = 0;
            let data, error;

            while (attempt < maxRetries) {
                if (attempt > 0) await delay(500);
                attempt++;

                console.log(`Update attempt ${attempt}, eventId: ${localCreatedEventId}`);

                const result = await supabase
                    .from('events')
                    .update(updates)
                    .eq('id', localCreatedEventId)
                    .select()
                    .single();

                data = result.data;
                error = result.error;

                if (error) {
                    console.error(`Update attempt ${attempt} failed:`, error);
                } else if (data) {
                    console.log(`Update succeeded on attempt ${attempt}`);
                    break;
                }
            }

            if (error) {
                console.error('Failed to update event after multiple attempts:', error);
            }

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.title).toBe(updates.title);
        });

        test('can delete records', async () => {
            if (!createdEventId) throw new Error('No event to delete');

            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', createdEventId);

            expect(error).toBeNull();

            // Verify the record is deleted
            const { data, error: readError } = await supabase
                .from('events')
                .select('*')
                .eq('id', createdEventId)
                .single();

            expect(data).toBeNull();
            expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

            // Reset createdEventId since we've deleted it
            createdEventId = null;
        });

        test('has access to all fields', async () => {
            if (!testSection) throw new Error('Test section is not initialized');

            const testEvent = {
                section_id: testSection.id,
                title: generateTestName('Test Event Fields'),
                date: new Date().toISOString().split('T')[0],
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 3600000).toISOString(),
                description: 'Test Description',
                duration: '1h'
            };

            // Create an event
            const { data: createData, error: createError } = await supabase
                .from('events')
                .insert([testEvent])
                .select()
                .single();

            expect(createError).toBeNull();
            expect(createData).not.toBeNull();
            if (createData?.id) {
                createdEventId = createData.id;
            }

            // Try to read all fields
            const { data: readData, error: readError } = await supabase
                .from('events')
                .select('id, section_id, title, date, start_time, end_time, description, duration, location_id')
                .eq('id', createdEventId)
                .single();

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            // All fields should be visible
            expect(readData?.title).toBe(testEvent.title);
            expect(readData?.section_id).toBe(testEvent.section_id);
            expect(readData?.date).toBe(testEvent.date);
            expect(readData?.description).toBe(testEvent.description);
            expect(readData?.duration).toBe(testEvent.duration);
        });
    });

    afterAll(async () => {
        // Cleanup test section
        if (testSection) {
            await EventsTest.cleanupTestData('sections', testSection.id);
        }
    });
}); 