// Vitest config in ESM to avoid TS type resolution issues in tsconfig
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/setup.vitest.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
