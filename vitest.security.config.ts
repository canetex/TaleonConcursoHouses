import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['tests/security/**/*.test.ts'],
      globals: false,
      pool: 'forks',
      testTimeout: 30_000,
    },
  }),
)
