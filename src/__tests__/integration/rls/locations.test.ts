import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Location } from '@/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Locations Table RLS Policies', () => {
    // Test data
    const testLocation: Omit<Location, 'id' | 'created_at'> = {
        name: 'Test Location',
        link_map: 'https://maps.test.com',
        link: 'https://test.com',
        link_address: 'Test Address'
    };

    let createdLocationId: number;

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

        if (createdLocationId) {
            await supabase.from('locations').delete().eq('id', createdLocationId);
        }

        await supabase.auth.signOut();
    });

    test('anonymous user cannot create location records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('locations')
            .insert([testLocation])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read location records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('locations')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read location records', async () => {
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Create a location
        const { data: createData, error: createError } = await supabase
            .from('locations')
            .insert([testLocation])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.name).toBe(testLocation.name);

        if (createData?.id) {
            createdLocationId = createData.id;
        }

        // Read all locations
        const { data: readData, error: readError } = await supabase
            .from('locations')
            .select('*');

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect(Array.isArray(readData)).toBe(true);
        expect(readData?.length).toBeGreaterThan(0);
        expect(readData?.find(l => l.id === createdLocationId)).toBeTruthy();
    });

    test('authenticated user can update own records', async () => {
        const updates = {
            name: 'Updated Test Location',
            link_address: 'Updated Test Address'
        };

        const { data, error } = await supabase
            .from('locations')
            .update(updates)
            .eq('id', createdLocationId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.name).toBe(updates.name);
        expect(data?.link_address).toBe(updates.link_address);
    });

    test('authenticated user can delete own records', async () => {
        const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', createdLocationId);

        expect(error).toBeNull();

        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('locations')
            .select('*')
            .eq('id', createdLocationId)
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdLocationId since we've deleted it
        createdLocationId = 0;
    });

    test('authenticated user has access to all fields of own records', async () => {
        // Create test location with all fields
        const { data: createData, error: createError } = await supabase
            .from('locations')
            .insert([testLocation])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdLocationId = createData.id;
        }

        // Try to read all fields
        const { data: readData, error: readError } = await supabase
            .from('locations')
            .select('id, name, link_map, link, link_address')
            .eq('id', createdLocationId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.name).toBe(testLocation.name);
        expect(readData?.link_map).toBe(testLocation.link_map);
        expect(readData?.link).toBe(testLocation.link);
        expect(readData?.link_address).toBe(testLocation.link_address);
    });
}); 