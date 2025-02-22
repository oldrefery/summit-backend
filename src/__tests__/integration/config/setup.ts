import { beforeAll } from 'vitest';

// Verify integration test environment
beforeAll(() => {
    const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'INTEGRATION_SUPABASE_USER_EMAIL',
        'INTEGRATION_SUPABASE_USER_PASSWORD'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(`Missing required integration test environment variables: ${missingVars.join(', ')}`);
    }

    // Verify we're using test database and not production
    const PROD_PROJECT_ID = 'iabwkgppahudnaouwaep';
    const TEST_PROJECT_ID = 'vupwomxxfqjmwtbptkfu';

    const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!currentUrl?.includes(TEST_PROJECT_ID)) {
        throw new Error('Integration tests must run against TEST database only!');
    }

    if (currentUrl?.includes(PROD_PROJECT_ID)) {
        throw new Error('DANGER: Attempting to run integration tests against PRODUCTION database! This is not allowed.');
    }
}); 