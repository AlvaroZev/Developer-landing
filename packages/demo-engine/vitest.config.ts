import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/flagship.ts', 'src/registry-demos.ts', 'src/types.ts'],
      thresholds: {
        statements: 85,
        branches: 50,
        functions: 85,
        lines: 85,
      },
    },
  },
});
