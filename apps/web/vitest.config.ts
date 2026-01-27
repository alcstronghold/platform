import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@alcstronghold/directus-client': resolve(__dirname, '../../packages/directus-client/src/index.ts'),
      '@alcstronghold/domain': resolve(__dirname, '../../packages/domain/src/index.ts'),
      '@alcstronghold/infrastructure': resolve(__dirname, '../../packages/infrastructure/src/index.ts'),
      '@alcstronghold/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
    },
  },
});
