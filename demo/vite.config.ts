import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env['VITE_BASE_URL'] ?? '/geopathfinder/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
