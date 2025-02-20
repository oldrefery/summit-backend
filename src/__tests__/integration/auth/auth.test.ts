import { describe, test, expect, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Authentication Integration Tests', () => {
    afterAll(async () => {
        // Ensure we're logged out after all tests
        await supabase.auth.signOut();
    });

    test('should successfully sign in with valid credentials', async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        expect(error).toBeNull();
        expect(data.session).not.toBeNull();
        expect(data.user?.email).toBe(process.env.INTEGRATION_SUPABASE_USER_EMAIL);
    });

    test('should fail to sign in with invalid credentials', async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'wrong@email.com',
            password: 'wrongpassword'
        });

        expect(error).not.toBeNull();
        expect(error?.message).toContain('Invalid login credentials');
        expect(data.session).toBeNull();
    });

    test('should get session after successful login', async () => {
        // First login
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Then get session
        const { data: { session }, error } = await supabase.auth.getSession();

        expect(error).toBeNull();
        expect(session).not.toBeNull();
        expect(session?.user?.email).toBe(process.env.INTEGRATION_SUPABASE_USER_EMAIL);
    });

    test('should successfully sign out', async () => {
        // First login
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        // Then sign out
        const { error } = await supabase.auth.signOut();
        expect(error).toBeNull();

        // Verify we're signed out
        const { data: { session } } = await supabase.auth.getSession();
        expect(session).toBeNull();
    });
}); 