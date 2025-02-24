import { describe, it, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { MarkdownPage } from '@/types';

class MarkdownPagesApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Markdown Pages API Tests', () => {
            describe('CRUD Operations', () => {
                let testPage: MarkdownPage;

                it('should get all markdown pages', async () => {
                    // Create two test pages with unique slugs
                    const timestamp1 = Date.now();
                    const timestamp2 = Date.now() + 1;

                    const { data: p1, error: error1 } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([this.generateMarkdownPageData({
                            slug: `test-page-${timestamp1}`
                        })])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(p1).toBeDefined();
                    if (p1) this.trackTestRecord('markdown_pages', p1.id);

                    const { data: p2, error: error2 } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([this.generateMarkdownPageData({
                            slug: `test-page-${timestamp2}`
                        })])
                        .select()
                        .single();

                    expect(error2).toBeNull();
                    expect(p2).toBeDefined();
                    if (p2) this.trackTestRecord('markdown_pages', p2.id);

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .select('*')
                        .order('title');

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(Array.isArray(data)).toBe(true);
                    expect(data!.length).toBeGreaterThanOrEqual(2);
                    expect(data!.some(p => p.id === p1!.id)).toBe(true);
                    expect(data!.some(p => p.id === p2!.id)).toBe(true);
                });

                it('should create a markdown page with all fields', async () => {
                    const pageData = this.generateMarkdownPageData();
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([pageData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testPage = data;
                    if (data) this.trackTestRecord('markdown_pages', data.id);

                    // Validate all fields
                    expect(data.slug).toBe(pageData.slug);
                    expect(data.title).toBe(pageData.title);
                    expect(data.content).toBe(pageData.content);
                    expect(data.published).toBe(pageData.published);

                    // Validate timestamps and id
                    this.validateTimestamps(data);
                    this.validateIds(data);
                });

                it('should read a markdown page by id', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .select()
                        .eq('id', testPage.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.id).toBe(testPage.id);
                });

                it('should update a markdown page', async () => {
                    const updateData = {
                        title: 'Updated Page Title',
                        content: '# Updated Content',
                        published: true
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .update(updateData)
                        .eq('id', testPage.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.title).toBe(updateData.title);
                    expect(data.content).toBe(updateData.content);
                    expect(data.published).toBe(updateData.published);
                    expect(data.id).toBe(testPage.id);
                });

                it('should delete a markdown page', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .delete()
                        .eq('id', testPage.id);

                    expect(error).toBeNull();

                    // Verify deletion
                    const { data, error: readError } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .select()
                        .eq('id', testPage.id)
                        .single();

                    expect(data).toBeNull();
                    expect(readError).toBeDefined();
                });
            });

            describe('Validation', () => {
                it('should require title field', async () => {
                    const pageData = this.generateMarkdownPageData();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { title: _title, ...dataWithoutTitle } = pageData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('markdown_pages')
                            .insert([dataWithoutTitle])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should not create pages with duplicate slug', async () => {
                    const pageData = this.generateMarkdownPageData();
                    const slug = `test-page-${Date.now()}`;
                    pageData.slug = slug;

                    // Создаем первую страницу
                    const { data: page1, error: error1 } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([pageData])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(page1).toBeDefined();
                    if (page1) this.trackTestRecord('markdown_pages', page1.id);

                    try {
                        // Пытаемся создать вторую страницу с тем же slug
                        const page2Data = this.generateMarkdownPageData();
                        page2Data.slug = slug;

                        await this.expectSupabaseError(
                            this.getAuthenticatedClient()
                                .from('markdown_pages')
                                .insert([page2Data])
                                .select()
                                .single(),
                            400
                        );
                    } finally {
                        // Очистка не нужна, так как базовый класс очистит все через trackTestRecord
                    }
                });

                it('should not allow updating page to use existing slug', async () => {
                    // Создаем две страницы с разными slug
                    const timestamp1 = Date.now();
                    const timestamp2 = timestamp1 + 1;

                    const page1Data = {
                        ...this.generateMarkdownPageData(),
                        slug: `test-page-${timestamp1}`
                    };
                    const page2Data = {
                        ...this.generateMarkdownPageData(),
                        slug: `test-page-${timestamp2}`
                    };

                    // Создаем первую страницу
                    const { data: page1 } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([page1Data])
                        .select()
                        .single();

                    expect(page1).toBeDefined();
                    if (page1) this.trackTestRecord('markdown_pages', page1.id);

                    // Создаем вторую страницу
                    const { data: page2 } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([page2Data])
                        .select()
                        .single();

                    expect(page2).toBeDefined();
                    if (page2) this.trackTestRecord('markdown_pages', page2.id);

                    // Пытаемся обновить вторую страницу, установив slug первой страницы
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('markdown_pages')
                            .update({ slug: page1Data.slug })
                            .eq('id', page2.id)
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate slug format', async () => {
                    const pageData = this.generateMarkdownPageData();
                    const invalidData = {
                        ...pageData,
                        slug: 'invalid slug with spaces'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('markdown_pages')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should enforce unique slug constraint', async () => {
                    // Создаем первую страницу
                    const pageData = this.generateMarkdownPageData();
                    const { data: firstPage, error: firstError } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([pageData])
                        .select()
                        .single();

                    expect(firstError).toBeNull();
                    expect(firstPage).toBeDefined();
                    if (firstPage) this.trackTestRecord('markdown_pages', firstPage.id);

                    // Пытаемся создать вторую страницу с тем же slug
                    const duplicateData = this.generateMarkdownPageData();
                    duplicateData.slug = pageData.slug;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('markdown_pages')
                            .insert([duplicateData])
                    );
                });
            });

            describe('Anonymous Access', () => {
                it('should not allow anonymous read', async () => {
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('markdown_pages')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const pageData = this.generateMarkdownPageData();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('markdown_pages')
                            .insert([pageData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const page = await this.createTestMarkdownPage();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('markdown_pages')
                            .update({ title: 'Updated Title' })
                            .eq('id', page.id),
                        401
                    );
                });

                it('should not allow anonymous delete', async () => {
                    const page = await this.createTestMarkdownPage();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('markdown_pages')
                            .delete()
                            .eq('id', page.id),
                        401
                    );
                });
            });

            describe('Edge Cases', () => {
                it('should handle very long text fields', async () => {
                    const longText = 'a'.repeat(1000);
                    const page = await this.createTestMarkdownPage();

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .update({
                            content: longText,
                            title: longText.slice(0, 255), // Ограничиваем длину заголовка
                        })
                        .eq('id', page.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.content).toBe(longText);
                    expect(data.title).toBe(longText.slice(0, 255));
                });

                it('should handle special characters in text fields', async () => {
                    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
                    const pageData = this.generateMarkdownPageData();
                    pageData.title += specialChars;
                    pageData.content += specialChars;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([pageData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.title).toBe(pageData.title);
                    expect(data.content).toBe(pageData.content);

                    if (data) this.trackTestRecord('markdown_pages', data.id);
                });

                it('should handle empty optional fields', async () => {
                    const pageData = {
                        title: `Test Page ${Date.now()}`,
                        slug: `test-page-${Date.now()}`,
                        content: '# Test Content',
                        published: false
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('markdown_pages')
                        .insert([pageData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.published).toBe(false);

                    if (data) this.trackTestRecord('markdown_pages', data.id);
                });
            });
        });
    }
}

// Run the tests
MarkdownPagesApiTest.runTests(); 