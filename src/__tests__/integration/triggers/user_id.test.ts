import { describe, test, expect } from 'vitest';
import { BaseIntegrationTest } from '../base-test';
import { delay } from '../../../utils/test-utils';
import type { SocialFeedPost, Person } from '@/types/supabase';

class UserIdTest extends BaseIntegrationTest {
    public static async createTestPerson() {
        return this.initializeTestData<Person>('people', {
            name: `Test Person ${Date.now()}`,
            role: 'speaker',
            title: 'Test Title',
            company: 'Test Company'
        });
    }

    public static async createTestPost(authorId: number) {
        return this.initializeTestData<SocialFeedPost>('social_feed_posts', {
            content: `Test Post ${Date.now()}`,
            author_id: authorId,
            timestamp: new Date().toISOString(),
            image_urls: [],
            updated_at: new Date().toISOString()
        });
    }

    public static async cleanupData(postId: number, personId: number) {
        await this.cleanupTestData('social_feed_posts', postId);
        await this.cleanupTestData('people', personId);
    }
}

describe('User ID Triggers', () => {
    test('should create records with user_id', async () => {
        // Create test person first
        const person = await UserIdTest.createTestPerson();
        expect(person).toBeDefined();
        expect(person.id).toBeDefined();

        await delay(1000);

        // Create test post
        const post = await UserIdTest.createTestPost(person.id);
        expect(post).toBeDefined();
        expect(post.id).toBeDefined();
        expect(post.user_id).toBe(UserIdTest.userId);

        await delay(1000);

        // Check post user_id
        const { data: postData } = await UserIdTest.getAuthenticatedClient()
            .from('social_feed_posts')
            .select('*')
            .eq('id', post.id)
            .single();

        expect(postData).toBeDefined();
        expect(postData?.user_id).toBe(UserIdTest.userId);

        await delay(1000);

        // Cleanup
        await UserIdTest.cleanupData(post.id, person.id);
    });
}); 