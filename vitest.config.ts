import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
      env: {
        VITE_API_ORIGIN: 'http://api.test',
        VITE_SOCKET_URL: 'http://api.test',
      },
      css: { modules: { classNameStrategy: 'non-scoped' } },
      restoreMocks: true,
      unstubEnvs: true,
    },
  }),
);
