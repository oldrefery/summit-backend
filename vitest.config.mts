// vitest.config.mts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__mocks__/setup.ts'],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    include: ['**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'src/__tests__/integration/**',
      'src/__tests__/e2e/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'node_modules/**',
        'src/types/**',
        '**/*.d.ts',
        'test{,s}/**',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
      ],
    },
  },
});
