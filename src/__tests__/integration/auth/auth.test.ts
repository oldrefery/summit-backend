import { describe, test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Authentication Integration Tests', () => {
    test('should successfully sign in with valid credentials', async () => {
        await delay(1000); // Add delay before test
        const { data, error } = await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        expect(error).toBeNull();
        expect(data.user).not.toBeNull();
        expect(data.session).not.toBeNull();
    });

    test('should fail to sign in with invalid credentials', async () => {
        await delay(1000); // Add delay before test
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'invalid@example.com',
            password: 'wrongpassword'
        });

        expect(error).not.toBeNull();
        expect(data.user).toBeNull();
        expect(data.session).toBeNull();
    });

    test('should get session after successful login', async () => {
        await delay(1000); // Add delay before test
        // First sign in
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        await delay(1000); // Add delay between requests

        // Then get session
        const { data: { session }, error } = await supabase.auth.getSession();

        expect(error).toBeNull();
        expect(session).not.toBeNull();
        expect(session?.user.email).toBe(process.env.INTEGRATION_SUPABASE_USER_EMAIL);
    });

    test('should successfully sign out', async () => {
        await delay(1000); // Add delay before test
        // First sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        expect(signInError).toBeNull();

        await delay(1000); // Add delay between requests

        // Verify we're signed in
        const { data: { session: sessionBefore } } = await supabase.auth.getSession();
        expect(sessionBefore).not.toBeNull();

        await delay(1000); // Add delay between requests

        // Then sign out
        const { error } = await supabase.auth.signOut();
        expect(error).toBeNull();

        await delay(1000); // Add delay between requests

        // Verify we're signed out
        const { data: { session: sessionAfter } } = await supabase.auth.getSession();
        expect(sessionAfter).toBeNull();
    });
}); 