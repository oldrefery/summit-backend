// vitest.integration.config.mts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/__tests__/integration/config/setup.ts'],
        include: ['src/__tests__/integration/**/*.test.ts'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'src/__tests__/integration/crud/base-crud.test.ts'],
        env: {
            NEXT_PUBLIC_SUPABASE_URL: 'https://vupwomxxfqjmwtbptkfu.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cHdvbXh4ZnFqbXd0YnB0a2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NTUxNTcsImV4cCI6MjA1NTUzMTE1N30.v3yMf6rWjMfoMtdQDrRCP0rLalbqq-05UL979cu5cVs',
            INTEGRATION_SUPABASE_USER_EMAIL: 'anonymoususer@firstlinesoftware.com',
            INTEGRATION_SUPABASE_USER_PASSWORD: 'Au123456!',
            INTEGRATION_SUPABASE_USER_EMAIL_2: 'testuser2@firstlinesoftware.com',
            INTEGRATION_SUPABASE_USER_PASSWORD_2: 'Tu123456!'
        },
        testTimeout: 30000
    },
}); 