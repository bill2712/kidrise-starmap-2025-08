// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://bill2712.github.io',
  vite: {
    plugins: [tailwindcss()],
    esbuild: {
      drop: ['console', 'debugger'],
    }
  },
  integrations: [react()]
});