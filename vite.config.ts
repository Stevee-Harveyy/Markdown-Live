import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'out/webview',
    rollupOptions: {
      input: 'webview-src/main.tsx',
      output: {
        entryFileNames: 'main.js',
        assetFileNames: '[name][extname]',
      },
    },
    // Keep sourcemaps; minify only in production
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'webview-src'),
    },
  },
});
