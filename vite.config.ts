import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `@use '@/styles/shared' as *;\n`,
      },
    },
  },
  server: {
    port: 3001,
  },
});
