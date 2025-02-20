import { describe, test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Authentication Integration Tests', () => {
    test('should create Supabase client with integration credentials', () => {
        const supabase = createClient(
            process.env.INTEGRATION_SUPABASE_URL!,
            process.env.INTEGRATION_SUPABASE_ANON_KEY!
        );

        expect(supabase).toBeDefined();
        expect(process.env.INTEGRATION_SUPABASE_URL).toBeDefined();
        expect(process.env.INTEGRATION_SUPABASE_ANON_KEY).toBeDefined();
    });
}); 