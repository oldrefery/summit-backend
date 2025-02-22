import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { EventPerson, Person, Event, Section } from '@/types';

/**
 * ВАЖНО: В тестах всегда используйте уникальные имена для записей!
 * Это предотвращает конфликты при параллельном запуске тестов
 * и позволяет запускать тесты многократно без необходимости очистки БД.
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Event People Table RLS Policies', () => {
    const uniqueId = Date.now();
    const testDate = '2024-03-20';
    let testSection: Section;
    let testPerson: Person;
    let testEvent: Event;
    let testEventPerson: Omit<EventPerson, 'id' | 'created_at'>;
    let createdEventPersonId: number;

    // Setup: Create test dependencies and ensure we're logged out
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
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 3600000).toISOString()
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

        await setupSupabase.auth.signOut();

        // Verify we're actually logged out
        const { data: { session } } = await setupSupabase.auth.getSession();
        expect(session).toBeNull();
    });

    // Clean up after all tests
    afterAll(async () => {
        // Login to clean up
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (createdEventPersonId) {
            await supabase.from('event_people').delete().eq('id', createdEventPersonId);
        }
        if (testEvent?.id) {
            await supabase.from('events').delete().eq('id', testEvent.id);
        }
        if (testPerson?.id) {
            await supabase.from('people').delete().eq('id', testPerson.id);
        }
        if (testSection?.id) {
            await supabase.from('sections').delete().eq('id', testSection.id);
        }

        await supabase.auth.signOut();
    });

    test('anonymous user cannot create event_people records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('event_people')
            .insert([testEventPerson])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read event_people records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('event_people')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read event_people records', async () => {
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Create an event_person
        const { data: createData, error: createError } = await supabase
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
            createdEventPersonId = createData.id;
        }

        // Read all event_people
        const { data: readData, error: readError } = await supabase
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

        const { data, error } = await supabase
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
        const { error } = await supabase
            .from('event_people')
            .delete()
            .eq('id', createdEventPersonId);

        expect(error).toBeNull();

        // Verify the record is deleted
        const { data, error: readError } = await supabase
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
        const { data: createData, error: createError } = await supabase
            .from('event_people')
            .insert([testEventPerson])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdEventPersonId = createData.id;
        }

        // Try to read all fields
        const { data: readData, error: readError } = await supabase
            .from('event_people')
            .select('id, event_id, person_id, role')
            .eq('id', createdEventPersonId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.event_id).toBe(testEventPerson.event_id);
        expect(readData?.person_id).toBe(testEventPerson.person_id);
        expect(readData?.role).toBe(testEventPerson.role);
    });
}); 