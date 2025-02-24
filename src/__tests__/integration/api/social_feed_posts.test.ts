import { BaseApiTest } from './base-api-test';
import type { SocialFeedPost, Person } from '@/types';

class SocialFeedPostsApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Social Feed Posts API Tests', () => {
            describe('CRUD Operations', () => {
                let testPost: SocialFeedPost;
                let testAuthor: Person;

                beforeAll(async () => {
                    testAuthor = await this.createTestPerson();
                });

                it('should create a post with all required fields', async () => {
                    const postData = {
                        ...this.generateSocialFeedPostData(),
                        author_id: testAuthor.id
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('social_feed_posts')
                        .insert([postData])
                        .select(`
                            *,
                            author:people(*)
                        `)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testPost = data;
                    if (data) this.trackTestRecord('social_feed_posts', data.id);

                    expect(data.content).toBe(postData.content);
                    expect(data.author_id).toBe(postData.author_id);
                    expect(data.user_id).toBe(postData.user_id);
                    expect(data.image_urls).toEqual(postData.image_urls);
                    expect(data.author).toBeDefined();
                    expect(data.author.id).toBe(testAuthor.id);
                });

                it('should get all posts', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('social_feed_posts')
                        .select(`
                            *,
                            author:people(*)
                        `)
                        .order('created_at', { ascending: false });

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(Array.isArray(data)).toBe(true);
                    expect(data!.length).toBeGreaterThan(0);
                    expect(data!.find(p => p.id === testPost.id)).toBeDefined();
                });

                it('should update a post', async () => {
                    const updateData = {
                        content: `Updated content ${Date.now()}`,
                        image_urls: ['https://example.com/updated.jpg']
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('social_feed_posts')
                        .update(updateData)
                        .eq('id', testPost.id)
                        .select(`
                            *,
                            author:people(*)
                        `)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.content).toBe(updateData.content);
                    expect(data.image_urls).toEqual(updateData.image_urls);
                    expect(data.author).toBeDefined();
                    expect(data.author.id).toBe(testAuthor.id);
                });

                it('should delete a post', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('social_feed_posts')
                        .delete()
                        .eq('id', testPost.id);

                    expect(error).toBeNull();

                    // Проверяем что пост действительно удален
                    const { data: checkData } = await this.getAuthenticatedClient()
                        .from('social_feed_posts')
                        .select()
                        .eq('id', testPost.id);

                    expect(checkData).toHaveLength(0);
                });
            });

            describe('Validation', () => {
                it('should require all mandatory fields', async () => {
                    const incompleteData = {
                        content: 'Test content'
                        // Отсутствуют обязательные поля
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('social_feed_posts')
                            .insert([incompleteData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate image_urls format', async () => {
                    const testAuthor = await this.createTestPerson();
                    const invalidData = {
                        ...this.generateSocialFeedPostData(),
                        author_id: testAuthor.id,
                        image_urls: 'not-an-array' // Должен быть массивом
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('social_feed_posts')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });
            });

            describe('Anonymous Access', () => {
                it('should not allow anonymous read', async () => {
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('social_feed_posts')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const postData = this.generateSocialFeedPostData();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('social_feed_posts')
                            .insert([postData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const post = await this.createTestSocialFeedPost();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('social_feed_posts')
                            .update({ content: 'Updated content' })
                            .eq('id', post.id),
                        401
                    );
                });

                it('should not allow anonymous delete', async () => {
                    const post = await this.createTestSocialFeedPost();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('social_feed_posts')
                            .delete()
                            .eq('id', post.id),
                        401
                    );
                });
            });
        });
    }
}

// Run the tests
SocialFeedPostsApiTest.runTests(); 