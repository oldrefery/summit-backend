import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Announcement, Person } from '@/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Announcements Table RLS Policies', () => {
    let testPersonId: number;
    let createdAnnouncementId: number;

    // Test data for person
    const testPerson: Omit<Person, 'id' | 'created_at'> = {
        name: 'Test Person',
        role: 'attendee',
        email: 'test@example.com',
        title: 'Test Title',
        company: 'Test Company',
        bio: 'Test Bio',
        country: 'Test Country',
        mobile: '+1234567890'
    };

    // Test data for announcement
    const testAnnouncement: Omit<Announcement, 'id' | 'created_at' | 'person_id'> = {
        content: 'Test Announcement Content',
        published_at: new Date().toISOString()
    };

    // Setup: Create test person and ensure we're logged out
    beforeAll(async () => {
        // First sign in to create a test person
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

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

        // Sign out for initial test state
        await supabase.auth.signOut();

        // Verify we're actually logged out
        const { data: { session } } = await supabase.auth.getSession();
        expect(session).toBeNull();
    });

    // Clean up after all tests
    afterAll(async () => {
        // Login to clean up
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Clean up test announcement if it exists
        if (createdAnnouncementId) {
            await supabase.from('announcements').delete().eq('id', createdAnnouncementId);
        }

        // Clean up test person
        if (testPersonId) {
            await supabase.from('people').delete().eq('id', testPersonId);
        }

        await supabase.auth.signOut();
    });

    test('anonymous user cannot create announcement records', async () => {
        // Verify we're not authenticated
        const { data: { session } } = await supabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await supabase
            .from('announcements')
            .insert([{ ...testAnnouncement, person_id: testPersonId }])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read announcement records', async () => {
        // Verify we're not authenticated
        const { data: { session } } = await supabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await supabase
            .from('announcements')
            .select('*');

        // Для анонимного пользователя должны вернуться пустые данные
        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read announcement records', async () => {
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Create an announcement
        const { data: createData, error: createError } = await supabase
            .from('announcements')
            .insert([{ ...testAnnouncement, person_id: testPersonId }])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.content).toBe(testAnnouncement.content);

        if (createData?.id) {
            createdAnnouncementId = createData.id;
        }

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
        const updates = {
            content: 'Updated Test Announcement Content',
            published_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', createdAnnouncementId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.content).toBe(updates.content);
    });

    test('authenticated user can delete own records', async () => {
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', createdAnnouncementId);

        expect(error).toBeNull();

        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('announcements')
            .select('*')
            .eq('id', createdAnnouncementId)
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdAnnouncementId since we've deleted it
        createdAnnouncementId = 0;
    });

    test('authenticated user has access to all fields of own records', async () => {
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