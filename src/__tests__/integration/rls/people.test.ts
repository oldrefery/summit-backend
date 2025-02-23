import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/database';
import type { Person } from '../../../types/supabase';
import { cleanupTestData, generateTestName, setupTestClient } from '../config/test-utils';

const TEST_PROJECT_ID = 'vupwomxxfqjmwtbptkfu';

describe('People Table RLS Policies', () => {
    let authClient: ReturnType<typeof createClient<Database>>;
    let anonClient: ReturnType<typeof createClient<Database>>;
    let testPersonId: number;

    const testPerson: Omit<Person, 'id' | 'created_at'> = {
        name: generateTestName('test_person'),
        role: 'speaker',
        title: 'Test Title',
        company: 'Test Company',
        bio: 'Test Bio',
        photo_url: 'https://example.com/photo.jpg',
        country: 'Test Country',
        email: 'test@example.com',
        mobile: '+1234567890'
    };

    beforeAll(async () => {
        const clients = await setupTestClient();
        authClient = clients.authClient;
        anonClient = clients.anonClient;

        // Verify we're using test database
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(TEST_PROJECT_ID)) {
            throw new Error('Tests must run against test database only!');
        }
    });

    afterAll(async () => {
        if (testPersonId) {
            await authClient.from('people').delete().eq('id', testPersonId);
        }
        await cleanupTestData(authClient);
    });

    test('anonymous user cannot create people records', async () => {
        const { data, error } = await anonClient
            .from('people')
            .insert([testPerson])
            .select()
            .single();

        expect(error).not.toBeNull();
        expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
        expect(data).toBeNull();
    });

    test('anonymous user cannot read people records', async () => {
        const { data, error } = await anonClient
            .from('people')
            .select('*');

        expect(data).toEqual([]);
        expect(error).toBeNull();
    });



    test('authenticated user has access to all fields', async () => {
        // Create test person with all fields
        const { data: createData, error: createError } = await authClient
            .from('people')
            .insert([testPerson])
            .select()
            .single();

        expect(createError).toBeNull();
        if (createData?.id) {
            testPersonId = createData.id;
        }

        // Try to read all fields
        const { data: readData, error: readError } = await authClient
            .from('people')
            .select('*')
            .eq('id', testPersonId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        // All fields should be visible
        expect(readData?.name).toBe(testPerson.name);
        expect(readData?.role).toBe(testPerson.role);
        expect(readData?.title).toBe(testPerson.title);
        expect(readData?.company).toBe(testPerson.company);
        expect(readData?.bio).toBe(testPerson.bio);
        expect(readData?.photo_url).toBe(testPerson.photo_url);
        expect(readData?.country).toBe(testPerson.country);
        expect(readData?.email).toBe(testPerson.email);
        expect(readData?.mobile).toBe(testPerson.mobile);
    });
}); 