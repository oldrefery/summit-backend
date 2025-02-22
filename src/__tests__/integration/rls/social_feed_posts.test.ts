import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { generateTestName, delay } from '../config/test-utils';
import type { Person } from '@/types';

const TEST_PROJECT_ID = 'vupwomxxfqjmwtbptkfu';

describe('social_feed_posts basic admin operations', () => {
    let testPerson: Person | null = null;
    let postId: number | null = null;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Setup: Create test person and login as admin
    beforeAll(async () => {
        // Verify we're using test database
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(TEST_PROJECT_ID)) {
            throw new Error('Tests must run against test database only!');
        }

        // Login as admin
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (loginError) throw loginError;
        await delay(1000);

        // Create test person
        const { data: personData, error: personError } = await supabase
            .from('people')
            .insert([{
                name: generateTestName('Test Person'),
                role: 'attendee',
                title: 'Test Title',
                company: 'Test Company'
            }])
            .select()
            .single();

        if (personError) throw personError;
        if (!personData) throw new Error('Person data is null');
        testPerson = personData;
        await delay(1000);
    });

    // Clean up after all tests
    afterAll(async () => {
        // Clean up test post if it exists
        if (postId) {
            await supabase.from('social_feed_posts').delete().eq('id', postId);
            await delay(1000);
        }

        // Clean up test person
        if (testPerson) {
            await supabase.from('people').delete().eq('id', testPerson.id);
            await delay(1000);
        }

        await supabase.auth.signOut();
    });

    describe('Admin CRUD Operations', () => {
        it('should allow admin to create posts', async () => {
            if (!testPerson) throw new Error('Test person not initialized');

            const { data, error } = await supabase
                .from('social_feed_posts')
                .insert([{
                    content: generateTestName('Test Post Content'),
                    author_id: testPerson.id,
                    timestamp: new Date().toISOString(),
                    image_urls: [],
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data.author_id).toBe(testPerson.id);
            postId = data.id;
            await delay(1000);
        });

        it('should allow admin to read posts', async () => {
            if (!postId) throw new Error('Post ID not initialized');

            const { data, error } = await supabase
                .from('social_feed_posts')
                .select('*')
                .eq('id', postId)
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data.id).toBe(postId);
            await delay(1000);
        });

        it('should allow admin to update posts', async () => {
            if (!postId) throw new Error('Post ID not initialized');

            const newContent = generateTestName('Updated test post');
            const { data, error } = await supabase
                .from('social_feed_posts')
                .update({
                    content: newContent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', postId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data.content).toBe(newContent);
            await delay(1000);
        });

        it('should allow admin to delete posts', async () => {
            if (!postId) throw new Error('Post ID not initialized');

            const { error } = await supabase
                .from('social_feed_posts')
                .delete()
                .eq('id', postId);

            expect(error).toBeNull();

            // Verify post is deleted
            const { data: checkData, error: checkError } = await supabase
                .from('social_feed_posts')
                .select()
                .eq('id', postId)
                .single();

            expect(checkData).toBeNull();
            expect(checkError?.message).toContain('JSON object requested, multiple (or no) rows returned');

            postId = null;
            await delay(1000);
        });
    });
}); 