import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';

const FONT_FILE = /\.woff2?$/;

export default defineConfig(({ mode }) => {
  const { VITE_SOCKET_URL, ORIGIN_SECRET } = loadEnv(mode, process.cwd(), '');
  const proxy = {
    '/api': {
      target: VITE_SOCKET_URL,
      changeOrigin: true,
      headers: ORIGIN_SECRET ? { 'x-origin-secret': ORIGIN_SECRET } : {},
    },
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use '@/styles/shared' as *;\n`,
        },
      },
    },
    build: {
      assetsInlineLimit: (filePath: string) =>
        FONT_FILE.test(filePath) ? false : undefined,
    },
    server: { port: 3001, proxy },
    preview: { proxy },
  };
});
