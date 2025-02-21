import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { EventPerson, Person, Event, Section } from '@/types';

/**
 * ВАЖНО: В тестах всегда используйте уникальные имена для записей!
 * Это предотвращает конфликты при параллельном запуске тестов
 * и позволяет запускать тесты многократно без необходимости очистки БД.
 */

describe('Event People Table RLS Policies', () => {
    const uniqueId = Date.now();
    const testDate = '2024-03-20';
    let testSection: Section;
    let testPerson: Person;
    let testEvent: Event;
    let testEventPerson: Omit<EventPerson, 'id' | 'created_at'>;
    let createdEventPersonId: number;
    let testSupabase: ReturnType<typeof createClient>;

    // Ensure we're logged out before each test
    beforeAll(async () => {
        // Create a new Supabase client for setup
        const setupSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Login to create dependencies
        const { error: loginError } = await setupSupabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (loginError) throw loginError;

        // Create test section first
        const { data: sectionData, error: sectionError } = await setupSupabase
            .from('sections')
            .insert([{
                name: `Test Section ${uniqueId}`,
                date: testDate
            }])
            .select()
            .single();

        if (sectionError) throw sectionError;
        if (!sectionData) throw new Error('Section data is null');
        testSection = sectionData;

        // Create test person
        const { data: personData, error: personError } = await setupSupabase
            .from('people')
            .insert([{
                name: `Test Speaker ${uniqueId}`,
                role: 'speaker',
                title: 'Test Title',
                company: 'Test Company'
            }])
            .select()
            .single();

        if (personError) throw personError;
        if (!personData) throw new Error('Person data is null');
        testPerson = personData;

        // Create test event
        const { data: eventData, error: eventError } = await setupSupabase
            .from('events')
            .insert([{
                section_id: testSection.id,
                title: `Test Event ${uniqueId}`,
                date: testDate,
                start_time: `${testDate}T10:00:00Z`,
                end_time: `${testDate}T11:00:00Z`
            }])
            .select()
            .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Event data is null');
        testEvent = eventData;

        // Prepare test event person data
        testEventPerson = {
            event_id: testEvent.id,
            person_id: testPerson.id,
            role: 'speaker'
        };

        // Create a new Supabase client for tests
        testSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify the test client is not authenticated
        const { data: { session } } = await testSupabase.auth.getSession();
        expect(session).toBeNull();
    });

    // Clean up after all tests
    afterAll(async () => {
        // Login to clean up
        await testSupabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (createdEventPersonId) {
            await testSupabase.from('event_people').delete().eq('id', createdEventPersonId);
        }
        if (testEvent?.id) {
            await testSupabase.from('events').delete().eq('id', testEvent.id);
        }
        if (testPerson?.id) {
            await testSupabase.from('people').delete().eq('id', testPerson.id);
        }
        if (testSection?.id) {
            await testSupabase.from('sections').delete().eq('id', testSection.id);
        }

        await testSupabase.auth.signOut();
    });

    describe('RLS Policies', () => {
        test('anonymous user cannot create event_people records', async () => {
            // Verify we're not authenticated
            const { data: { session } } = await testSupabase.auth.getSession();
            expect(session).toBeNull();

            const { data, error } = await testSupabase
                .from('event_people')
                .insert([testEventPerson])
                .select()
                .single();

            expect(error).not.toBeNull();
            expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
            expect(data).toBeNull();
        });

        test('anonymous user cannot read event_people records', async () => {
            // Verify we're not authenticated
            const { data: { session } } = await testSupabase.auth.getSession();
            expect(session).toBeNull();

            const { data, error } = await testSupabase
                .from('event_people')
                .select('*');

            expect(data).toEqual([]);
            expect(error).toBeNull();
        });

        test('authenticated user can create and read event_people records', async () => {
            // Login first
            await testSupabase.auth.signInWithPassword({
                email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
                password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
            });

            // Create an event_person
            const { data: createData, error: createError } = await testSupabase
                .from('event_people')
                .insert([testEventPerson])
                .select()
                .single();

            expect(createError).toBeNull();
            expect(createData).not.toBeNull();
            expect(createData?.event_id).toBe(testEventPerson.event_id);
            expect(createData?.person_id).toBe(testEventPerson.person_id);
            expect(createData?.role).toBe(testEventPerson.role);

            if (createData?.id) {
                createdEventPersonId = createData.id as number;
            }

            // Read all event_people
            const { data: readData, error: readError } = await testSupabase
                .from('event_people')
                .select('*');

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            expect(Array.isArray(readData)).toBe(true);
            expect(readData?.length).toBeGreaterThan(0);
            expect(readData?.find(ep => ep.id === createdEventPersonId)).toBeTruthy();
        });

        test('authenticated user can update own records', async () => {
            const updates = {
                role: 'speaker' as const
            };

            const { data, error } = await testSupabase
                .from('event_people')
                .update(updates)
                .eq('id', createdEventPersonId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.role).toBe(updates.role);
        });

        test('authenticated user can delete own records', async () => {
            const { error } = await testSupabase
                .from('event_people')
                .delete()
                .eq('id', createdEventPersonId);

            expect(error).toBeNull();

            // Verify the record is deleted
            const { data, error: readError } = await testSupabase
                .from('event_people')
                .select('*')
                .eq('id', createdEventPersonId)
                .single();

            expect(data).toBeNull();
            expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

            // Reset createdEventPersonId since we've deleted it
            createdEventPersonId = 0;
        });

        test('authenticated user has access to all fields of own records', async () => {
            // Create test event_person with all fields
            const { data: createData, error: createError } = await testSupabase
                .from('event_people')
                .insert([testEventPerson])
                .select()
                .single();

            expect(createError).toBeNull();
            if (createData?.id) {
                createdEventPersonId = createData.id as number;
            }

            // Try to read all fields
            const { data: readData, error: readError } = await testSupabase
                .from('event_people')
                .select('id, event_id, person_id, role, people(*)')
                .eq('id', createdEventPersonId)
                .single();

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            // All fields should be visible
            expect(readData?.event_id).toBe(testEventPerson.event_id);
            expect(readData?.person_id).toBe(testEventPerson.person_id);
            expect(readData?.role).toBe(testEventPerson.role);
            expect(readData?.people).toBeTruthy();
        });
    });

    describe('Integration Tests', () => {
        test('can read related event data', async () => {
            // Login first
            await testSupabase.auth.signInWithPassword({
                email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
                password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
            });

            // Create event_person record
            const { data: createData, error: createError } = await testSupabase
                .from('event_people')
                .insert([testEventPerson])
                .select()
                .single();

            expect(createError).toBeNull();
            expect(createData).not.toBeNull();
            if (createData?.id) {
                createdEventPersonId = createData.id as number;
            }

            // Read with event data
            const { data: readData, error: readError } = await testSupabase
                .from('event_people')
                .select(`
                    id,
                    event_id,
                    person_id,
                    role,
                    event:events!inner (
                        id,
                        title,
                        date,
                        start_time,
                        end_time
                    )
                `)
                .eq('id', createdEventPersonId)
                .single();

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            const eventData = readData?.event as unknown as { id: number, title: string };
            expect(eventData).toBeTruthy();
            expect(eventData.id).toBe(testEvent.id);
            expect(eventData.title).toBe(testEvent.title);
        });

        test('can read related person data', async () => {
            // Read with person data
            const { data: readData, error: readError } = await testSupabase
                .from('event_people')
                .select(`
                    id,
                    event_id,
                    person_id,
                    role,
                    person:people!inner (
                        id,
                        name,
                        role,
                        title,
                        company
                    )
                `)
                .eq('id', createdEventPersonId)
                .single();

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            const personData = readData?.person as unknown as { id: number, name: string, role: string };
            expect(personData).toBeTruthy();
            expect(personData.id).toBe(testPerson.id);
            expect(personData.name).toBe(testPerson.name);
            expect(personData.role).toBe(testPerson.role);
        });

        test('event_people records are deleted when event is deleted', async () => {
            // Create new event
            const { data: newEvent } = await testSupabase
                .from('events')
                .insert([{
                    title: `Test Event for Cascade Delete ${uniqueId}`,
                    date: testDate,
                    start_time: `${testDate}T10:00:00Z`,
                    end_time: `${testDate}T11:00:00Z`,
                    section_id: testSection.id
                }])
                .select()
                .single();

            if (!newEvent) throw new Error('Event data is null');

            // Create new event_person
            const { data: newEventPerson } = await testSupabase
                .from('event_people')
                .insert([{
                    event_id: newEvent.id,
                    person_id: testPerson.id,
                    role: 'speaker'
                }])
                .select()
                .single();

            if (!newEventPerson) throw new Error('Event person data is null');

            // Delete the event
            await testSupabase
                .from('events')
                .delete()
                .eq('id', newEvent.id as number);

            // Check that event_person was deleted
            const { data, error } = await testSupabase
                .from('event_people')
                .select()
                .eq('id', newEventPerson.id as unknown as number)
                .single();

            expect(data).toBeNull();
            expect(error?.message).toContain('JSON object requested, multiple (or no) rows returned');
        });

        test('cannot create event_person with non-existent event', async () => {
            const { error } = await testSupabase
                .from('event_people')
                .insert([{
                    event_id: 999999, // non-existent event
                    person_id: testPerson.id,
                    role: 'speaker'
                }])
                .select()
                .single();

            expect(error).not.toBeNull();
            expect(error?.message).toMatch(/violates foreign key constraint/);
        });

        test('cannot create event_person with non-existent person', async () => {
            const { error } = await testSupabase
                .from('event_people')
                .insert([{
                    event_id: testEvent.id,
                    person_id: 999999, // non-existent person
                    role: 'speaker'
                }])
                .select()
                .single();

            expect(error).not.toBeNull();
            expect(error?.message).toMatch(/violates foreign key constraint/);
        });

        test('cannot delete person with existing event_people records', async () => {
            // Create new person and event_person
            const { data: newPerson } = await testSupabase
                .from('people')
                .insert([{
                    name: `Test Speaker for Delete Protection ${uniqueId}`,
                    role: 'speaker',
                    title: 'Test Title',
                    company: 'Test Company'
                }])
                .select()
                .single();

            if (!newPerson) throw new Error('Person data is null');

            const { data: newEventPerson } = await testSupabase
                .from('event_people')
                .insert([{
                    event_id: testEvent.id,
                    person_id: newPerson.id,
                    role: 'speaker'
                }])
                .select()
                .single();

            if (!newEventPerson) throw new Error('Event person data is null');

            // Try to delete the person
            const { error } = await testSupabase
                .from('people')
                .delete()
                .eq('id', newPerson.id as unknown as number);

            expect(error).not.toBeNull();
            expect(error?.message).toContain('violates foreign key constraint');

            // Verify the person still exists
            const { data } = await testSupabase
                .from('people')
                .select()
                .eq('id', newPerson.id as unknown as number)
                .single();

            expect(data).not.toBeNull();
            expect(data?.id).toBe(newPerson.id);

            // Clean up
            await testSupabase
                .from('event_people')
                .delete()
                .eq('id', newEventPerson.id as unknown as number);
            await testSupabase
                .from('people')
                .delete()
                .eq('id', newPerson.id as unknown as number);
        });
    });
}); 