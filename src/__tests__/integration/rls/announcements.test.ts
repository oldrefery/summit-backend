import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Announcement, Person } from '@/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Announcements Table RLS Policies', () => {
    let testPersonId: number;
    let createdAnnouncementId: number;
    const uniqueId = Date.now(); // Add unique identifier for test data

    // Test data for person
    const testPerson: Omit<Person, 'id' | 'created_at'> = {
        name: `Test Person ${uniqueId}`,
        role: 'attendee',
        email: `test${uniqueId}@example.com`,
        title: 'Test Title',
        company: 'Test Company',
        bio: 'Test Bio',
        country: 'Test Country',
        mobile: '+1234567890'
    };

    // Test data for announcement
    const testAnnouncement: Omit<Announcement, 'id' | 'created_at' | 'person_id'> = {
        content: `Test Announcement Content ${uniqueId}`,
        published_at: new Date().toISOString()
    };

    // Setup: Create test person and ensure we're logged out
    beforeAll(async () => {
        await delay(1000); // Add delay before setup

        // First sign in to create a test person
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (signInError) throw signInError;

        await delay(1000); // Add delay between requests

        // Check if test person already exists
        const { data: existingPerson } = await supabase
            .from('people')
            .select('id')
            .eq('email', testPerson.email)
            .single();

        if (existingPerson) {
            testPersonId = existingPerson.id;
        } else {
            // Create a test person
            const { data: personData, error: personError } = await supabase
                .from('people')
                .insert([testPerson])
                .select()
                .single();

            if (personError) {
                throw new Error(`Failed to create test person: ${personError.message}`);
            }

            testPersonId = personData.id;
        }

        await delay(1000); // Add delay between requests

        // Sign out for initial test state
        await supabase.auth.signOut();

        // Wait for session to be cleared
        await delay(1000);
    });

    // Clean up after all tests
    afterAll(async () => {
        await delay(1000); // Add delay before cleanup

        // Login to clean up
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        await delay(1000); // Add delay between requests

        // Clean up test announcement if it exists
        if (createdAnnouncementId) {
            await supabase.from('announcements').delete().eq('id', createdAnnouncementId);
            await delay(1000); // Add delay between requests
        }

        // Clean up test person
        if (testPersonId) {
            await supabase.from('people').delete().eq('id', testPersonId);
        }

        await delay(1000); // Add delay before final signout
        await supabase.auth.signOut();
    });

    test('unauthenticated user cannot create announcement records', async () => {
        await delay(1000); // Add delay before test

        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('announcements')
            .insert([{ ...testAnnouncement, person_id: testPersonId }])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('unauthenticated user cannot read announcement records', async () => {
        await delay(1000); // Add delay before test

        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('announcements')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read announcement records', async () => {
        await delay(1000); // Add delay before test

        // Login first
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (signInError) throw signInError;

        await delay(1000); // Add delay between requests

        // Create an announcement
        const { data: createData, error: createError } = await supabase
            .from('announcements')
            .insert([{ ...testAnnouncement, person_id: testPersonId }])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.content).toBe(testAnnouncement.content);
        expect(createData?.person_id).toBe(testPersonId);

        if (createData?.id) {
            createdAnnouncementId = createData.id;
        }

        await delay(1000); // Add delay between requests

        // Read all announcements
        const { data: readData, error: readError } = await supabase
            .from('announcements')
            .select('*');

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect(Array.isArray(readData)).toBe(true);
        expect(readData?.length).toBeGreaterThan(0);
        expect(readData?.find(a => a.id === createdAnnouncementId)).toBeTruthy();
    });

    test('authenticated user can update own records', async () => {
        await delay(1000); // Add delay before test

        const updates = {
            content: `Updated Test Announcement Content ${uniqueId}`
        };

        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', Number(createdAnnouncementId))
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.content).toBe(updates.content);
    });

    test('authenticated user can delete own records', async () => {
        await delay(1000); // Add delay before test

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', Number(createdAnnouncementId));

        expect(error).toBeNull();

        await delay(1000); // Add delay between requests

        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('announcements')
            .select('*')
            .eq('id', Number(createdAnnouncementId))
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdAnnouncementId since we've deleted it
        createdAnnouncementId = 0;
    });

    test('authenticated user has access to all fields of own records', async () => {
        await delay(1000); // Add delay before test

        // Create test announcement with all fields
        const { data: createData, error: createError } = await supabase
            .from('announcements')
            .insert([{ ...testAnnouncement, person_id: testPersonId }])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdAnnouncementId = createData.id;
        }

        await delay(1000); // Add delay between requests

        // Try to read all fields
        const { data: readData, error: readError } = await supabase
            .from('announcements')
            .select('id, person_id, content, published_at')
            .eq('id', createdAnnouncementId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.person_id).toBe(testPersonId);
        expect(readData?.content).toBe(testAnnouncement.content);
        // Compare dates by converting both to ISO strings
        expect(new Date(readData?.published_at).toISOString())
            .toBe(new Date(testAnnouncement.published_at).toISOString());
    });
}); 