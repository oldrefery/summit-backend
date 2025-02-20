import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Event, Section } from '@/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Events Table RLS Policies', () => {
    let testSectionId: number;
    let createdEventId: number;

    // Test data for section
    const testSection: Omit<Section, 'id' | 'created_at'> = {
        name: 'Test Section',
        date: new Date().toISOString().split('T')[0]
    };

    // Test data for event
    const testEvent: Omit<Event, 'id' | 'created_at' | 'section' | 'location' | 'event_people'> = {
        section_id: 0, // Will be set after section creation
        title: 'Test Event',
        date: new Date().toISOString().split('T')[0],
        start_time: new Date().toISOString(),
        end_time: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(), // +1 hour
        description: 'Test Event Description',
        duration: '1 hour',
        location_id: null
    };

    // Helper function to normalize timezone format
    const normalizeTimestamp = (timestamp: string) => {
        return new Date(timestamp).toISOString();
    };

    // Setup: Create test section and ensure we're logged out
    beforeAll(async () => {
        // First sign in to create a test section
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Create a test section
        const { data: sectionData, error: sectionError } = await supabase
            .from('sections')
            .insert([testSection])
            .select()
            .single();

        if (sectionError) {
            throw new Error(`Failed to create test section: ${sectionError.message}`);
        }

        testSectionId = sectionData.id;
        testEvent.section_id = testSectionId;

        // Sign out for initial test state
        await supabase.auth.signOut();
    });

    // Clean up after all tests
    afterAll(async () => {
        // Login to clean up
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Clean up test event if it exists
        if (createdEventId) {
            await supabase.from('events').delete().eq('id', createdEventId);
        }

        // Clean up test section
        if (testSectionId) {
            await supabase.from('sections').delete().eq('id', testSectionId);
        }

        await supabase.auth.signOut();
    });

    test('unauthenticated user cannot create event records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('events')
            .insert([testEvent])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('unauthenticated user cannot read event records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('events')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read event records', async () => {
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Create an event
        const { data: createData, error: createError } = await supabase
            .from('events')
            .insert([testEvent])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.title).toBe(testEvent.title);
        expect(createData?.section_id).toBe(testSectionId);

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

    test('authenticated user can update own records', async () => {
        const updates = {
            title: 'Updated Test Event',
            description: 'Updated Test Description'
        };

        const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', createdEventId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.title).toBe(updates.title);
        expect(data?.description).toBe(updates.description);
    });

    test('authenticated user can delete own records', async () => {
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
        createdEventId = 0;
    });

    test('authenticated user has access to all fields of own records', async () => {
        // Create test event with all fields
        const { data: createData, error: createError } = await supabase
            .from('events')
            .insert([testEvent])
            .select()
            .single();

        expect(createError).toBeNull();
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
        expect(readData?.section_id).toBe(testEvent.section_id);
        expect(readData?.title).toBe(testEvent.title);
        expect(readData?.date).toBe(testEvent.date);
        expect(normalizeTimestamp(readData?.start_time)).toBe(testEvent.start_time);
        expect(normalizeTimestamp(readData?.end_time)).toBe(testEvent.end_time);
        expect(readData?.description).toBe(testEvent.description);
        expect(readData?.duration).toBe(testEvent.duration);
        expect(readData?.location_id).toBe(testEvent.location_id);
    });
}); 