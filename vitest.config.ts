import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/unit/**/*.test.ts', 'tests/security/**/*.test.ts'],
      globals: false,
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://test.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
    },
  }),
)
