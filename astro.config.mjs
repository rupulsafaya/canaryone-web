import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://canaryone.ai',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always',
  },
});
