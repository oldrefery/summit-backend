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
        include: ['src/__tests__/integration/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
        env: {
            INTEGRATION_SUPABASE_URL: 'https://vupwomxxfqjmwtbptkfu.supabase.co',
            INTEGRATION_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cHdvbXh4ZnFqbXd0YnB0a2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNjUyNzgsImV4cCI6MjA1MzY0MTI3OH0.6Dtab-JfH5JTSpPQ0amG1hnjvADTANeTWLe4Y1x2nwA',
            INTEGRATION_SUPABASE_USER_EMAIL: 'anonymoususer@firstlinesoftware.com',
            INTEGRATION_SUPABASE_USER_PASSWORD: 'Au123456!'
        }
    },
}); 