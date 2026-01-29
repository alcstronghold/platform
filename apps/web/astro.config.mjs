// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.alcstronghold.com',
  vite: {
    // @ts-ignore
    plugins: [tailwind()],
  },
  integrations: [sitemap(), mdx()],
});
