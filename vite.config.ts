import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    // mapbox-gl itself accounts for the bulk of this chunk — splitting it out
    // means app-code changes don't bust the browser cache for the vendor bundle.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox-gl': ['mapbox-gl'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
