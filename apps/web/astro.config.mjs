// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

import angular from '@analogjs/astro-angular';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.alcstronghold.com',
  vite: {
    // @ts-ignore
    plugins: [tailwind()]
  },
  integrations: [sitemap(), mdx(), angular()]
});
