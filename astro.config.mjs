import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import mcp from 'astro-mcp';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://doraaidreamer.github.io',
  integrations: [mdx(), mcp()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: { theme: 'github-dark', wrap: true },
  },
});
