import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Version } from '@/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('JSON Versions Table RLS Policies', () => {
    const uniqueId = Date.now();
    let createdVersionId: string;

    // Test data
    const testVersion: Omit<Version, 'id' | 'published_at'> = {
        version: `1.0.${uniqueId}`,
        file_path: `/test/path/${uniqueId}`,
        changes: { test: 1 },
        file_url: `https://example.com/test-${uniqueId}.json`
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
        if (createdVersionId) {
            await supabase.from('json_versions').delete().eq('id', createdVersionId);
        }

        await delay(1000);
        await supabase.auth.signOut();
    });

    test('anonymous user cannot create json version records', async () => {
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
            .from('json_versions')
            .insert([testVersion])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read json version records', async () => {
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
            .from('json_versions')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read json version records', async () => {
        await delay(1000);
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        await delay(1000);
        // Create a version
        const { data: createData, error: createError } = await supabase
            .from('json_versions')
            .insert([testVersion])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.version).toBe(testVersion.version);
        expect(createData?.file_path).toBe(testVersion.file_path);
        expect(createData?.changes).toEqual(testVersion.changes);
        expect(createData?.file_url).toBe(testVersion.file_url);

        if (createData?.id) {
            createdVersionId = createData.id;
        }

        await delay(1000);
        // Read all versions
        const { data: readData, error: readError } = await supabase
            .from('json_versions')
            .select('*');

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect(Array.isArray(readData)).toBe(true);
        expect(readData?.length).toBeGreaterThan(0);
        expect(readData?.find(v => v.id === createdVersionId)).toBeTruthy();
    });

    test('authenticated user can update own records', async () => {
        await delay(1000);
        const updates = {
            file_path: `/updated/path/${uniqueId}`,
            changes: { updated: 'data' },
            file_url: `https://example.com/updated-${uniqueId}.json`
        };

        const { data, error } = await supabase
            .from('json_versions')
            .update(updates)
            .eq('id', createdVersionId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.file_path).toBe(updates.file_path);
        expect(data?.changes).toEqual(updates.changes);
        expect(data?.file_url).toBe(updates.file_url);
    });

    test('authenticated user can delete own records', async () => {
        await delay(1000);
        const { error } = await supabase
            .from('json_versions')
            .delete()
            .eq('id', createdVersionId);

        expect(error).toBeNull();

        await delay(1000);
        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('json_versions')
            .select('*')
            .eq('id', createdVersionId)
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdVersionId since we've deleted it
        createdVersionId = '';
    });

    test('authenticated user has access to all fields of own records', async () => {
        await delay(1000);
        // Create test version with all fields
        const { data: createData, error: createError } = await supabase
            .from('json_versions')
            .insert([testVersion])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdVersionId = createData.id;
        }

        await delay(1000);
        // Try to read all fields
        const { data: readData, error: readError } = await supabase
            .from('json_versions')
            .select('id, version, file_path, changes, file_url, published_at, published_by')
            .eq('id', createdVersionId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.version).toBe(testVersion.version);
        expect(readData?.file_path).toBe(testVersion.file_path);
        expect(readData?.changes).toEqual(testVersion.changes);
        expect(readData?.file_url).toBe(testVersion.file_url);
        expect(readData?.published_at).toBeDefined();
    });
}); 