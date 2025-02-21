import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { SocialFeedPost, Person } from '@/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Social Feed Posts Table RLS Policies', () => {
    const uniqueId = Date.now();
    let createdPostId: number;
    let testPersonId: number;

    // Test data for person
    const testPerson: Omit<Person, 'id' | 'created_at'> = {
        name: `Test Person ${uniqueId}`,
        role: 'attendee',
        title: 'Test Title',
        company: 'Test Company'
    };

    // Test data for post
    const testPost: Omit<SocialFeedPost, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
        content: `Test Post Content ${uniqueId}`,
        timestamp: new Date().toISOString().replace('Z', '+00:00'),
        image_urls: [`https://example.com/image-${uniqueId}.jpg`],
        author_id: 0 // Будет обновлено после создания тестового пользователя
    };

    // Setup: Create test person and ensure we're logged out
    beforeAll(async () => {
        await delay(1000);

        // First sign in to create a test person
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (signInError) throw signInError;

        await delay(1000);

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
        testPost.author_id = testPersonId;

        await delay(1000);

        // Sign out for initial test state
        await supabase.auth.signOut();

        // Wait for session to be cleared
        await delay(1000);
    });

    // Clean up after all tests
    afterAll(async () => {
        await delay(1000);
        // Login to clean up
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        await delay(1000);

        // Clean up test post if it exists
        if (createdPostId) {
            await supabase.from('social_feed_posts').delete().eq('id', createdPostId);
            await delay(1000);
        }

        // Clean up test person
        if (testPersonId) {
            await supabase.from('people').delete().eq('id', testPersonId);
        }

        await delay(1000);
        await supabase.auth.signOut();
    });

    test('anonymous user cannot create social feed post records', async () => {
        await delay(1000);
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('social_feed_posts')
            .insert([testPost])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read social feed post records', async () => {
        await delay(1000);
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('social_feed_posts')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read social feed post records', async () => {
        await delay(1000);
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        await delay(1000);
        // Create a post
        const { data: createData, error: createError } = await supabase
            .from('social_feed_posts')
            .insert([testPost])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.content).toBe(testPost.content);
        expect(createData?.image_urls).toEqual(testPost.image_urls);
        expect(createData?.author_id).toBe(testPost.author_id);
        expect(createData?.timestamp).toBe(testPost.timestamp);

        if (createData?.id) {
            createdPostId = createData.id;
        } else {
            throw new Error('Failed to get created post ID');
        }

        await delay(1000);
        // Read all posts
        const { data: readData, error: readError } = await supabase
            .from('social_feed_posts')
            .select('*');

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect(Array.isArray(readData)).toBe(true);
        expect(readData?.length).toBeGreaterThan(0);
        expect(readData?.find(p => p.id === createdPostId)).toBeTruthy();
    });

    test('authenticated user can update own records', async () => {
        await delay(1000);
        const updates = {
            content: `Updated Test Post Content ${uniqueId}`,
            timestamp: new Date().toISOString().replace('Z', '+00:00'),
            image_urls: [`https://example.com/updated-image-${uniqueId}.jpg`]
        };

        const { data, error } = await supabase
            .from('social_feed_posts')
            .update(updates)
            .eq('id', createdPostId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.content).toBe(updates.content);
        expect(data?.image_urls).toEqual(updates.image_urls);
        expect(data?.author_id).toBe(testPost.author_id);
        expect(data?.timestamp).toBe(updates.timestamp);
    });

    test('authenticated user can delete own records', async () => {
        await delay(1000);
        const { error } = await supabase
            .from('social_feed_posts')
            .delete()
            .eq('id', createdPostId);

        expect(error).toBeNull();

        await delay(1000);
        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('social_feed_posts')
            .select('*')
            .eq('id', createdPostId)
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdPostId since we've deleted it
        createdPostId = 0;
    });

    test('authenticated user has access to all fields of own records', async () => {
        await delay(1000);
        // Create test post with all fields
        const { data: createData, error: createError } = await supabase
            .from('social_feed_posts')
            .insert([testPost])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdPostId = createData.id;
        } else {
            throw new Error('Failed to get created post ID');
        }

        await delay(1000);
        // Try to read all fields
        const { data: readData, error: readError } = await supabase
            .from('social_feed_posts')
            .select('id, content, image_urls, timestamp, author_id, created_at, updated_at, user_id')
            .eq('id', createdPostId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.content).toBe(testPost.content);
        expect(readData?.image_urls).toEqual(testPost.image_urls);
        expect(readData?.author_id).toBe(testPost.author_id);
        expect(readData?.timestamp).toBe(testPost.timestamp);
        expect(readData?.created_at).toBeTruthy();
        expect(readData?.updated_at).toBeTruthy();
        expect(readData?.user_id).toBeTruthy();
    });
}); 