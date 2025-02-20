import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Person } from '@/types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('People Table RLS Policies', () => {
    // Test data
    const testPerson: Omit<Person, 'id' | 'created_at'> = {
        name: 'Test Person',
        role: 'attendee',
        email: 'test@example.com',
        title: 'Test Title',
        company: 'Test Company',
        bio: 'Test Bio',
        country: 'Test Country',
        mobile: '+1234567890'
    };

    let createdPersonId: number;

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

        if (createdPersonId) {
            await supabase.from('people').delete().eq('id', createdPersonId);
        }

        await supabase.auth.signOut();
    });

    test('anonymous user cannot create people records', async () => {
        // Verify we're not authenticated
        const { data: { session } } = await supabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await supabase
            .from('people')
            .insert([testPerson])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read people records', async () => {
        // Verify we're not authenticated
        const { data: { session } } = await supabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await supabase
            .from('people')
            .select('*');

        // Для анонимного пользователя должны вернуться пустые данные
        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read people records', async () => {
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Create a person
        const { data: createData, error: createError } = await supabase
            .from('people')
            .insert([testPerson])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.name).toBe(testPerson.name);

        if (createData?.id) {
            createdPersonId = createData.id;
        }

        // Read all people
        const { data: readData, error: readError } = await supabase
            .from('people')
            .select('*');

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect(Array.isArray(readData)).toBe(true);
        expect(readData?.length).toBeGreaterThan(0);
        expect(readData?.find(p => p.id === createdPersonId)).toBeTruthy();
    });

    test('authenticated user can update own records', async () => {
        const updates = {
            name: 'Updated Test Person',
            title: 'Updated Title'
        };

        const { data, error } = await supabase
            .from('people')
            .update(updates)
            .eq('id', createdPersonId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.name).toBe(updates.name);
        expect(data?.title).toBe(updates.title);
    });

    test('authenticated user can delete own records', async () => {
        const { error } = await supabase
            .from('people')
            .delete()
            .eq('id', createdPersonId);

        expect(error).toBeNull();

        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('people')
            .select('*')
            .eq('id', createdPersonId)
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdPersonId since we've deleted it
        createdPersonId = 0;
    });

    test('authenticated user has access to sensitive fields of own records', async () => {
        // Create test person with sensitive data
        const { data: createData, error: createError } = await supabase
            .from('people')
            .insert([testPerson])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdPersonId = createData.id;
        }

        // Try to read sensitive fields
        const { data: readData, error: readError } = await supabase
            .from('people')
            .select('id, name, title, company, bio, country, mobile, email')
            .eq('id', createdPersonId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible for own records
        expect(readData?.name).toBe(testPerson.name);
        expect(readData?.title).toBe(testPerson.title);
        expect(readData?.mobile).toBe(testPerson.mobile);
        expect(readData?.email).toBe(testPerson.email);
    });
}); 