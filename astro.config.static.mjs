// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base: '/landing-page-optimizer/',
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['html2pdf.js/dist/html2pdf.bundle.min.js'],
    },
  }
});
