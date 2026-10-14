import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works from any sub-path (e.g. GitHub Pages /75-Hard-App/).
export default defineConfig({
  base: './',
  plugins: [react()],
  // Firebase is loaded lazily as its own chunk; it's big but only fetched once and then cached.
  build: { chunkSizeWarningLimit: 700 },
});
