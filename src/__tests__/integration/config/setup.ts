import { beforeAll } from 'vitest';

// Verify integration test environment
beforeAll(() => {
    const requiredEnvVars = [
        'INTEGRATION_SUPABASE_URL',
        'INTEGRATION_SUPABASE_ANON_KEY',
        'INTEGRATION_SUPABASE_USER_EMAIL',
        'INTEGRATION_SUPABASE_USER_PASSWORD'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(`Missing required integration test environment variables: ${missingVars.join(', ')}`);
    }

    // Verify we're using test database
    if (!process.env.INTEGRATION_SUPABASE_URL?.includes('vupwomxxfqjmwtbptkfu')) {
        throw new Error('Integration tests must run against TEST database only!');
    }
}); 