---
title: 用 Astro 重写博客：为什么我从 Jekyll 换到了它
subtitle: 内容站点的现代答案——岛屿架构、内容集合、零 JS 默认
date: 2026-09-03
author: DoraAiDreamer
category: 工具与其他
tags:
  - Astro
  - 博客
  - 前端
  - 静态站点
---

这个博客原本用 Jekyll（2016 年的 Hux 主题）。随着内容变多、越来越多图解和专栏要做，Jekyll 的痛点逐渐明显。最后我把它迁到了 **Astro**——这篇文章记录为什么换、Astro 是什么、以及它适合谁。

## 一句话

> Astro 是一个**面向内容站点**的现代静态站点框架：默认不发一点 JavaScript，需要交互时才把组件「孤岛」水合；文章用 Markdown 写，布局用组件写。

## 为什么换：Jekyll 的几个痛点

| 痛点 | Jekyll | Astro |
| --- | --- | --- |
| 环境 | Ruby + gem，本地装一堆依赖还常版本冲突 | 一个 Node 工具链，`npm install && npm run dev` |
| 构建 | 慢，文章多了明显等待 | 基于 Vite，毫秒级热更新 |
| 分类/标签 | 手写 Liquid 循环，易错（本博客就踩过 `{{ }}` 语法坑） | **内容集合（Content Collections）** 用 schema 声明，类型校验 |
| 交互 | 全站引 jQuery，手写 JS | **岛屿架构**：只有用到交互的组件加载那一点 JS |
| 组件化 | 靠 include 拼 HTML，无组件 | `.astro` 组件，可嵌 React/Vue/Svelte |
| 代码高亮 | rouge 配置繁琐 | Shiki 内置，`github-dark` 一行配置 |

## 三个让我决定迁移的特性

### 1. 内容集合：分类是「声明」出来的

不用再写 Liquid 遍历 `site.categories`。在 `content.config.ts` 里用 schema 描述文章结构，**写错分类名、漏字段，构建时直接报错**：

```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['大模型', '机器学习', '大数据', '网络与安全', '工具与其他']),
    tags: z.array(z.string()).default([]),
  }),
});
```

首页分组就是普通的 `filter` / `map`，不再和模板语法搏斗。

### 2. 岛屿架构：默认零 JS，交互按需加载

Astro 默认把页面渲染成纯静态 HTML，**不发任何 JS**。只有你在页面里用了交互组件（比如本博客图解大模型里那个「拖动 temperature 看概率变化」的滑块），Astro 才会给那一个组件加载一小段 JS。

```astro
---
import TemperatureIsland from '../components/TemperatureIsland.astro';
---
<TemperatureIsland client:load />
```

实测：首页 0 字节 JS，用到滑块的页面才带那一点脚本。相比 Jekyll 全站加载 jQuery，首屏轻得多。

### 3. Markdown + 组件混用

文章还是纯 Markdown（以前的 26 篇几乎原样搬过来），但写「图解大模型」这种页面时，可以在 `.astro` 文件里直接写 HTML、内联 SVG、并插入交互组件——配图、表格、可点的演示都在一个文件里，还能复用。

## 适合谁 / 不适合谁

- ✅ 博客、文档、教程、作品集等**以内容为主**的站
- ✅ 想要 Markdown 写作 + 偶尔上点交互
- ✅ 在乎性能、SEO、首屏速度
- ❌ 纯后台管理系统、重交互 SPA（那些用 Next/Nuxt 更合适）

## 迁移成本

出乎意料地低：文章是标准 Markdown + front matter，批量转一下就好；手绘的内联 SVG 全部直接复用；只有少数纯 HTML 章节页需要改成 `.astro` 组件（标记几乎照抄）。部署照旧用 GitHub Pages，加一个 GitHub Actions 构建即可。

> 本站的「推理加速专栏」在 Astro 里也更推荐**构建时**把外部教程仓库的 Markdown 拉进来生成静态页，而不是在浏览器运行时抓取——国内访问更快、也不依赖运行时网络。

如果你也在维护一个内容站、又被老框架的环境和交互折腾，值得花半小时起一个 Astro demo 对比看看。
