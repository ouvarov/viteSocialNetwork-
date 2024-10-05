import { defineConfig } from 'vite';
import path from 'path';
import process from 'process';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Устанавливаем алиас '@' на корень 'src'
    },
  },
  define: {
    'process.env': process.env,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
              @import "@/styles/colors.scss";
              @import "@/styles/mixins.scss";
              @import "@/styles/fonts.scss";
            `,
      },
    },
  },
  server: {
    port: 3001,
  },
});
