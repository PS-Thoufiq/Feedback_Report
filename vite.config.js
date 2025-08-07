import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This alias helps resolve the worker import
      'pdfjs-dist/build/pdf.worker.js': 'pdfjs-dist/build/pdf.worker.mjs',
      // Alternative if the above doesn't work:
      // 'pdfjs-dist/build/pdf.worker?worker': 'pdfjs-dist/build/pdf.worker.mjs',
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  worker: {
    format: 'es',
    plugins: [react()],
  },
  build: {
    rollupOptions: {
      external: ['pdfjs-dist/build/pdf.worker'], // Prevent bundling the worker
    },
  },
});