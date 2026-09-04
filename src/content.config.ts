import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 文章集合：front matter 用 schema 强约束（这就是 Astro 管分类/标签的方式，
// 不用再手写 Liquid 循环，类型错误在构建时就能发现）
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    author: z.string().optional(),
    category: z.enum(['大模型', '机器学习', '大数据', '网络与安全', '工具与其他']),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
