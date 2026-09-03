import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://doraaidreamer.github.io',
  markdown: {
    shikiConfig: { theme: 'github-dark', wrap: true },
  },
});
