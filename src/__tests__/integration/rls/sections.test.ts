import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Section } from '@/types';

/**
 * ВАЖНО: В тестах всегда используйте уникальные имена для записей!
 * 
 * В таблице sections есть уникальное ограничение на поле name,
 * поэтому для каждого теста мы добавляем uniqueId к имени секции.
 * Это предотвращает конфликты при параллельном запуске тестов
 * и позволяет запускать тесты многократно без необходимости очистки БД.
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Sections Table RLS Policies', () => {
    const uniqueId = Date.now();
    // Test data
    const testSection: Omit<Section, 'id' | 'created_at'> = {
        name: `Test Section ${uniqueId}`,
        date: '2024-03-20'
    };

    let createdSectionId: number;

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

        if (createdSectionId) {
            await supabase.from('sections').delete().eq('id', createdSectionId);
        }

        await supabase.auth.signOut();
    });

    test('anonymous user cannot create section records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('sections')
            .insert([testSection])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read section records', async () => {
        // Create a new Supabase client for anonymous user
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Verify we're not authenticated
        const { data: { session } } = await anonSupabase.auth.getSession();
        expect(session).toBeNull();

        const { data, error } = await anonSupabase
            .from('sections')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });

    test('authenticated user can create and read section records', async () => {
        // Login first
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Create a section
        const { data: createData, error: createError } = await supabase
            .from('sections')
            .insert([testSection])
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect(createData?.name).toBe(testSection.name);
        expect(createData?.date).toBe(testSection.date);

        if (createData?.id) {
            createdSectionId = createData.id;
        }

        // Read all sections
        const { data: readData, error: readError } = await supabase
            .from('sections')
            .select('*');

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect(Array.isArray(readData)).toBe(true);
        expect(readData?.length).toBeGreaterThan(0);
        expect(readData?.find(s => s.id === createdSectionId)).toBeTruthy();
    });

    test('authenticated user can update own records', async () => {
        const updates = {
            name: `Updated Test Section ${uniqueId}`,
            date: '2024-03-21'
        };

        const { data, error } = await supabase
            .from('sections')
            .update(updates)
            .eq('id', createdSectionId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.name).toBe(updates.name);
        expect(data?.date).toBe(updates.date);
    });

    test('authenticated user can delete own records', async () => {
        const { error } = await supabase
            .from('sections')
            .delete()
            .eq('id', createdSectionId);

        expect(error).toBeNull();

        // Verify the record is deleted
        const { data, error: readError } = await supabase
            .from('sections')
            .select('*')
            .eq('id', createdSectionId)
            .single();

        expect(data).toBeNull();
        expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

        // Reset createdSectionId since we've deleted it
        createdSectionId = 0;
    });

    test('authenticated user has access to all fields of own records', async () => {
        // Create test section with all fields
        const newTestSection = {
            ...testSection,
            name: `Test Section All Fields ${uniqueId}`
        };

        const { data: createData, error: createError } = await supabase
            .from('sections')
            .insert([newTestSection])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            createdSectionId = createData.id;
        }

        // Try to read all fields
        const { data: readData, error: readError } = await supabase
            .from('sections')
            .select('id, name, date')
            .eq('id', createdSectionId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.name).toBe(newTestSection.name);
        expect(readData?.date).toBe(newTestSection.date);
    });
}); 