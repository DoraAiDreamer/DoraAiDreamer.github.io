# DoraAiDreamer Blog · Astro

个人技术博客，基于 **[Astro](https://astro.build/)** 构建。内容以学习笔记与图解为主：大模型与 Transformer、机器学习、大数据、网络与安全、工具实践，以及一个 vLLM 推理加速专栏。

🔗 在线：<https://doraaidreamer.github.io/>

## ✨ 特性

- **Astro 5 + Content Collections**：文章用 Markdown 写，front matter 用 schema 校验（分类写错构建即报错）
- **三栏文档式布局**：左侧专题目录、右侧本页目录（滚动高亮），窄屏自动收起
- **岛屿架构**：默认零 JS，只有交互组件（如图解大模型里的 temperature 滑块）按需加载
- **内联 SVG 图解**：图解章节/文章里的图都是矢量 SVG，深浅色自适应
- **深色模式**：跟随系统 + 手动切换
- **Shiki `github-dark` 代码高亮**
- **推理加速专栏**：24 篇 vLLM 源码解读，查看器运行时抓取仓库 Markdown 渲染

## 🚀 本地开发

```bash
npm install
npm run dev      # http://localhost:4321，热更新
npm run build    # 产出静态文件到 dist/
npm run preview  # 预览构建产物
```

## 📁 目录结构

```text
src/
├── content.config.ts        # 文章集合与 front matter schema（合法分类在此定义）
├── content/blog/            # 文章（Markdown），文件名即 URL slug
├── components/              # 组件：DoraemonLogo / TemperatureIsland / PageTOC / ThemeToggle
├── layouts/BaseLayout.astro # 三栏布局 + 顶部导航
├── styles/global.css        # 设计系统（浅/深主题变量）
└── pages/
    ├── index.astro          # 首页分类卡片
    ├── llm.astro            # 图解大模型
    ├── ml.astro             # 图解机器学习
    ├── inference.astro      # 推理加速专栏
    ├── inference/view.astro # Markdown 查看器
    └── blog/[slug].astro    # 文章详情（动态路由）
public/img/                  # 文章图片资源
.github/workflows/deploy.yml # GitHub Pages 自动部署
```

## ✍️ 写文章

在 `src/content/blog/` 新建 `slug.md`，front matter：

```yaml
---
title: "文章标题"
subtitle: "副标题（可选）"
date: 2026-09-03
author: DoraAiDreamer
category: 大模型        # 必须是 schema 中的合法分类
tags: [Transformer, 深度学习]
---
```

合法分类：`大模型 / 机器学习 / 大数据 / 网络与安全 / 工具与其他`（在 `content.config.ts` 中维护）。

## 🚢 部署

推送 `master` 后由 GitHub Actions 自动构建部署（见 `.github/workflows/deploy.yml`）。
首次需要在仓库 **Settings → Pages → Build and deployment → Source 选择 “GitHub Actions”**。

## 📄 License

MIT
