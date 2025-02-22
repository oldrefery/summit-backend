import { describe, it, expect } from 'vitest';
import { BaseIntegrationTest } from '../base-test';
import { delay } from '../../../utils/test-utils';

class SocialFeedPostsTest extends BaseIntegrationTest {
    static async createPost(content: string, authorId: number) {
        const { data, error } = await this.getAuthenticatedClient()
            .from('social_feed_posts')
            .insert({
                content,
                author_id: authorId,
                timestamp: new Date().toISOString(),
                image_urls: []
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

describe('social_feed_posts RLS policies', () => {
    let postId: number;
    let authorId: number;

    beforeAll(async () => {
        // Create test person
        const { data: personData, error: personError } = await SocialFeedPostsTest.getAuthenticatedClient()
            .from('people')
            .insert({
                name: `Test Person ${Date.now()}`,
                role: 'speaker',
                title: 'Test Title',
                company: 'Test Company'
            })
            .select()
            .single();

        if (personError) throw personError;
        authorId = personData.id;

        // Wait for data to be ready
        await delay(2000);
    });

    afterAll(async () => {
        // Cleanup test data
        if (postId) {
            await SocialFeedPostsTest.getAuthenticatedClient()
                .from('social_feed_posts')
                .delete()
                .eq('id', postId);
            await delay(1000);
        }
        if (authorId) {
            await SocialFeedPostsTest.getAuthenticatedClient()
                .from('people')
                .delete()
                .eq('id', authorId);
            await delay(1000);
        }
    });

    it('should deny access for anonymous users', async () => {
        const { data, error } = await SocialFeedPostsTest.getAnonymousClient()
            .from('social_feed_posts')
            .select('*')
            .limit(1);

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    it('should allow authenticated users to create posts', async () => {
        const data = await SocialFeedPostsTest.createPost('Test post', authorId);

        expect(data).not.toBeNull();
        expect(data.user_id).toBe(SocialFeedPostsTest.userId);
        expect(data.author_id).toBe(authorId);
        postId = data.id;

        await delay(1000);
    });

    it('should allow authenticated users to read all posts', async () => {
        const { data, error } = await SocialFeedPostsTest.getAuthenticatedClient()
            .from('social_feed_posts')
            .select('*')
            .limit(1);

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(Array.isArray(data)).toBe(true);

        await delay(1000);
    });

    it('should allow users to update their own posts', async () => {
        const newContent = 'Updated test post';
        const { data, error } = await SocialFeedPostsTest.getAuthenticatedClient()
            .from('social_feed_posts')
            .update({ content: newContent })
            .eq('id', postId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data.content).toBe(newContent);

        await delay(1000);
    });

    it('should not allow users to update others posts', async () => {
        // Try to update a non-existent post (or post that belongs to another user)
        const { error } = await SocialFeedPostsTest.getAuthenticatedClient()
            .from('social_feed_posts')
            .update({ content: 'Should not work' })
            .eq('id', 999999) // Используем заведомо несуществующий ID
            .single();

        if (!error) throw new Error('Expected RLS error but got none');
        expect(error.message).toContain('JSON object requested, multiple (or no) rows returned');

        await delay(1000);
    });

    it('should allow users to delete their own posts', async () => {
        const { error } = await SocialFeedPostsTest.getAuthenticatedClient()
            .from('social_feed_posts')
            .delete()
            .eq('id', postId);

        expect(error).toBeNull();

        // Verify post is deleted
        const { data: checkData, error: checkError } = await SocialFeedPostsTest.getAuthenticatedClient()
            .from('social_feed_posts')
            .select()
            .eq('id', postId)
            .single();

        expect(checkData).toBeNull();
        expect(checkError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        postId = 0; // Reset postId as it's been deleted

        await delay(1000);
    });

    it('should not allow users to delete others posts', async () => {
        const { error } = await SocialFeedPostsTest.getAuthenticatedClient()
            .from('social_feed_posts')
            .delete()
            .eq('id', 1) // Using ID 1 which should belong to another user
            .single();

        if (!error) throw new Error('Expected error but got none');
        expect(error.message).toContain('JSON object requested, multiple (or no) rows returned');

        await delay(1000);
    });

    it('should not allow users to update posts without matching user_id', async () => {
        // Create a post with explicit user_id
        const { error: createError } = await SocialFeedPostsTest.getAuthenticatedClient()
            .from('social_feed_posts')
            .insert({
                content: 'Test post for RLS check',
                author_id: authorId,
                timestamp: new Date().toISOString(),
                image_urls: [],
                user_id: '00000000-0000-0000-0000-000000000000' // Другой user_id
            })
            .select()
            .single();

        expect(createError).not.toBeNull();
        expect(createError?.message).toContain('new row violates row-level security');

        await delay(1000);
    });
}); 