import { describe, test, expect } from 'vitest';
import { BaseIntegrationTest } from '../base-test';
import type { MarkdownPage } from '@/types';
import { delay } from '../../../utils/test-utils';

class MarkdownPagesTest extends BaseIntegrationTest {
    static async createPage(title: string, published: boolean = true) {
        return this.initializeTestData<MarkdownPage>('markdown_pages', {
            title,
            slug: title.toLowerCase().replace(/\s+/g, '-'),
            content: `# ${title}\n\nTest content for ${title}`,
            published
        });
    }
}

describe('Markdown Pages Table RLS Policies', () => {
    let createdPageId: number;
    const uniqueId = Date.now();

    const testPage: Omit<MarkdownPage, 'id' | 'created_at' | 'updated_at'> = {
        title: `Test Page ${uniqueId}`,
        slug: `test-page-${uniqueId}`,
        content: '# Test Content',
        published: true
    };

    describe('Anonymous Access', () => {
        test('cannot create records', async () => {
            const { data, error } = await MarkdownPagesTest.getAnonymousClient()
                .from('markdown_pages')
                .insert([testPage])
                .select()
                .single();

            expect(error).not.toBeNull();
            expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
            expect(data).toBeNull();

            await delay(1000);
        });

        test('cannot read records', async () => {
            const { data, error } = await MarkdownPagesTest.getAnonymousClient()
                .from('markdown_pages')
                .select('*');

            expect(data).toEqual([]);
            expect(error).toBeNull();

            await delay(1000);
        });
    });

    describe('Authenticated Access', () => {
        test('can create and read records', async () => {
            const page = await MarkdownPagesTest.createPage(`Test Page Create ${uniqueId}`);
            createdPageId = page.id;

            expect(page).not.toBeNull();
            expect(page.title).toContain('Test Page Create');

            // Read all pages
            const { data: readData, error: readError } = await MarkdownPagesTest.getAuthenticatedClient()
                .from('markdown_pages')
                .select('*');

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            expect(Array.isArray(readData)).toBe(true);
            expect(readData?.length).toBeGreaterThan(0);
            expect(readData?.find(p => p.id === createdPageId)).toBeTruthy();

            await delay(1000);
        });

        test('can update own records', async () => {
            const updates = {
                title: `Updated Page ${uniqueId}`,
                content: '# Updated Content'
            };

            const { data, error } = await MarkdownPagesTest.getAuthenticatedClient()
                .from('markdown_pages')
                .update(updates)
                .eq('id', createdPageId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.title).toBe(updates.title);
            expect(data?.content).toBe(updates.content);

            await delay(1000);
        });

        test('can delete own records', async () => {
            await MarkdownPagesTest.cleanupTestData('markdown_pages', createdPageId);

            // Verify deletion
            const { data, error: readError } = await MarkdownPagesTest.getAuthenticatedClient()
                .from('markdown_pages')
                .select('*')
                .eq('id', createdPageId)
                .single();

            expect(data).toBeNull();
            expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

            createdPageId = 0;

            await delay(1000);
        });

        test('has access to all fields of own records', async () => {
            const page = await MarkdownPagesTest.createPage(`Test Page Fields ${uniqueId}`);
            createdPageId = page.id;

            // Try to read all fields
            const { data: readData, error: readError } = await MarkdownPagesTest.getAuthenticatedClient()
                .from('markdown_pages')
                .select('id, title, slug, content, published, created_at, updated_at')
                .eq('id', createdPageId)
                .single();

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            // All fields should be visible
            expect(readData?.title).toContain('Test Page Fields');
            expect(readData?.slug).toContain('test-page-fields');
            expect(readData?.content).toContain('Test content for');
            expect(readData?.published).toBe(true);
            expect(readData?.created_at).toBeTruthy();
            expect(readData?.updated_at).toBeTruthy();

            await delay(1000);
        });
    });
}); 