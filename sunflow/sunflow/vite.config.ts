
/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Home Assistant Ingress serves the UI under a sub-path.
  // A relative base keeps asset URLs working regardless of mount point.
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // Frontend on 5173
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend on 3000
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts', // Point to the new location inside tests folder
    css: false,
    exclude: [...configDefaults.exclude, '**/e2e/**'],
  },
});
