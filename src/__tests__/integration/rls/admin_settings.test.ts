import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEST_FEATURE = `test_flag_${Date.now()}`;

// Helper to get anonymous client
function getAnonymousClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

describe('Admin Settings (Feature Flag) Integration Tests', () => {
    beforeAll(async () => {
        // Ensure authenticated for setup
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });
        // Remove all old records with this feature
        await supabase.from('admin_settings').delete().eq('feature', TEST_FEATURE);
        // Create test feature flag
        await supabase.from('admin_settings').insert({ feature: TEST_FEATURE, value: false }).select().maybeSingle();
        // Explicitly wait for the record to appear
        let attempts = 0;
        let found = false;
        while (attempts < 5 && !found) {
            const { data } = await supabase
                .from('admin_settings')
                .select('feature')
                .eq('feature', TEST_FEATURE)
                .maybeSingle();
            if (data) found = true;
            else await new Promise(res => setTimeout(res, 200));
            attempts++;
        }
        if (!found) throw new Error('Test feature flag was not created in admin_settings');
        await supabase.auth.signOut();
    });

    afterAll(async () => {
        // Clean up test feature flag
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });
        await supabase.from('admin_settings').delete().eq('feature', TEST_FEATURE);
        await supabase.auth.signOut();
    });

    test('authenticated user can read feature flag', async () => {
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });
        const { data, error } = await supabase
            .from('admin_settings')
            .select('feature, value')
            .eq('feature', TEST_FEATURE)
            .maybeSingle();
        expect(error).toBeNull();
        if (!data) throw new Error('Feature flag not found in admin_settings (read test)');
        expect(data.feature).toBe(TEST_FEATURE);
        expect(data.value).toBe(false);
        await supabase.auth.signOut();
    });

    test('authenticated user can update feature flag', async () => {
        await supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });
        const { data, error } = await supabase
            .from('admin_settings')
            .update({ value: true })
            .eq('feature', TEST_FEATURE)
            .select()
            .maybeSingle();
        expect(error).toBeNull();
        if (!data) throw new Error('Feature flag not found in admin_settings (update test)');
        expect(data?.value).toBe(true);
        await supabase.auth.signOut();
    });

    test('anonymous user cannot read feature flag', async () => {
        const anon = getAnonymousClient();
        const { data, error } = await anon
            .from('admin_settings')
            .select('feature, value')
            .eq('feature', TEST_FEATURE)
            .single();
        expect(data).toBeNull();
        expect(error).not.toBeNull();
    });

    test('anonymous user cannot update feature flag', async () => {
        const anon = getAnonymousClient();
        const { data, error } = await anon
            .from('admin_settings')
            .update({ value: false })
            .eq('feature', TEST_FEATURE)
            .select()
            .single();
        expect(data).toBeNull();
        expect(error).not.toBeNull();
    });
}); 