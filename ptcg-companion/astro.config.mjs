// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bill2712.github.io',
  base: '/kidrise-starmap-2025-08',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), sitemap()]
});