import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { MarkdownPage } from '@/types';

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Markdown Pages Table RLS Policies', () => {
    const uniqueId = Date.now();
    let createdPageId: number;

    // Test data
    const testPage: Omit<MarkdownPage, 'id' | 'created_at' | 'updated_at'> = {
        title: `Test Page ${uniqueId}`,
        slug: `test-page-${uniqueId}`,
        content: '# Test Content',
        published: true
    };

    // Ensure we're logged out before each test
    beforeAll(async () => {
        await delay(1000);
        await supabase.auth.signOut();

        // Verify we're actually logged out
        const { data: { session } } = await supabase.auth.getSession();
        expect(session).toBeNull();
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
        if (createdPageId) {
            await supabase.from('markdown_pages').delete().eq('id', createdPageId);
        }

        await delay(1000);
        await supabase.auth.signOut();
    });

    test('anonymous user cannot create markdown page records', async () => {
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
            .from('markdown_pages')
            .insert([testPage])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read markdown page records', async () => {
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
            .from('markdown_pages')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read markdown page records', async () => {
        await delay(1000);
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        await delay(1000);
        // Create a markdown page
        const { data: createData, error: createError } = await supabase
            .from('markdown_pages')
            .insert([testPage])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.title).toBe(testPage.title);
        expect(createData?.slug).toBe(testPage.slug);
        expect(createData?.content).toBe(testPage.content);
        expect(createData?.published).toBe(testPage.published);

        if (createData?.id) {
            createdPageId = createData.id;
        }

        await delay(1000);
        // Read all markdown pages
        const { data: readData, error: readError } = await supabase
            .from('markdown_pages')
            .select('*');

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect(Array.isArray(readData)).toBe(true);
        expect(readData?.length).toBeGreaterThan(0);
        expect(readData?.find(p => p.id === createdPageId)).toBeTruthy();
    });

    test('authenticated user can update own records', async () => {
        await delay(1000);
        const updates = {
            title: `Updated Test Page ${uniqueId}`,
            content: '# Updated Content'
        };

        const { data, error } = await supabase
            .from('markdown_pages')
            .update(updates)
            .eq('id', createdPageId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.title).toBe(updates.title);
        expect(data?.content).toBe(updates.content);
    });

    test('authenticated user can delete own records', async () => {
        await delay(1000);
        const { error } = await supabase
            .from('markdown_pages')
            .delete()
            .eq('id', createdPageId);

        expect(error).toBeNull();

        await delay(1000);
        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('markdown_pages')
            .select('*')
            .eq('id', createdPageId)
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdPageId since we've deleted it
        createdPageId = 0;
    });

    test('authenticated user has access to all fields of own records', async () => {
        await delay(1000);
        // Create test markdown page with all fields
        const { data: createData, error: createError } = await supabase
            .from('markdown_pages')
            .insert([testPage])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdPageId = createData.id;
        }

        await delay(1000);
        // Try to read all fields
        const { data: readData, error: readError } = await supabase
            .from('markdown_pages')
            .select('id, title, slug, content, published, created_at, updated_at')
            .eq('id', createdPageId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.title).toBe(testPage.title);
        expect(readData?.slug).toBe(testPage.slug);
        expect(readData?.content).toBe(testPage.content);
        expect(readData?.published).toBe(testPage.published);
        expect(readData?.created_at).toBeTruthy();
        expect(readData?.updated_at).toBeTruthy();
    });
}); 