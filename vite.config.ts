import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://mt-solid-vite.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
