import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Resource } from '@/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Resources Table RLS Policies', () => {
    // Test data
    const testResource: Omit<Resource, 'id' | 'created_at'> = {
        name: 'Test Resource',
        link: 'https://test.com',
        description: 'Test Description',
        is_route: false
    };

    let createdResourceId: number;

    // Ensure we're logged out before each test
    beforeAll(async () => {
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

        if (createdResourceId) {
            await supabase.from('resources').delete().eq('id', createdResourceId);
        }

        await supabase.auth.signOut();
    });

    test('anonymous user cannot create resource records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('resources')
            .insert([testResource])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read resource records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('resources')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read resource records', async () => {
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Create a resource
        const { data: createData, error: createError } = await supabase
            .from('resources')
            .insert([testResource])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.name).toBe(testResource.name);

        if (createData?.id) {
            createdResourceId = createData.id;
        }

        // Read all resources
        const { data: readData, error: readError } = await supabase
            .from('resources')
            .select('*');

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect(Array.isArray(readData)).toBe(true);
        expect(readData?.length).toBeGreaterThan(0);
        expect(readData?.find(r => r.id === createdResourceId)).toBeTruthy();
    });

    test('authenticated user can update own records', async () => {
        const updates = {
            name: 'Updated Test Resource',
            description: 'Updated Test Description'
        };

        const { data, error } = await supabase
            .from('resources')
            .update(updates)
            .eq('id', createdResourceId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.name).toBe(updates.name);
        expect(data?.description).toBe(updates.description);
    });

    test('authenticated user can delete own records', async () => {
        const { error } = await supabase
            .from('resources')
            .delete()
            .eq('id', createdResourceId);

        expect(error).toBeNull();

        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('resources')
            .select('*')
            .eq('id', createdResourceId)
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdResourceId since we've deleted it
        createdResourceId = 0;
    });

    test('authenticated user has access to all fields of own records', async () => {
        // Create test resource with all fields
        const { data: createData, error: createError } = await supabase
            .from('resources')
            .insert([testResource])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdResourceId = createData.id;
        }

        // Try to read all fields
        const { data: readData, error: readError } = await supabase
            .from('resources')
            .select('id, name, link, description, is_route')
            .eq('id', createdResourceId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.name).toBe(testResource.name);
        expect(readData?.link).toBe(testResource.link);
        expect(readData?.description).toBe(testResource.description);
        expect(readData?.is_route).toBe(testResource.is_route);
    });
}); 